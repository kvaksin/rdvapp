//
//  APIService.swift
//  RDVApp
//
//  API service for backend communication
//

import Foundation
import Combine

class APIService: ObservableObject {
    static let shared = APIService()
    
    private let baseURL: String
    private let session = URLSession.shared
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Authentication Token
    @Published var authToken: String? {
        didSet {
            UserDefaults.standard.set(authToken, forKey: "auth_token")
        }
    }
    
    private init() {
        #if DEBUG
        self.baseURL = "http://localhost:4000/api"
        #else
        self.baseURL = "https://your-production-api.com/api"
        #endif
        
        // Load saved token
        self.authToken = UserDefaults.standard.string(forKey: "auth_token")
    }
    
    // MARK: - Network Request Builder
    private func createRequest(
        endpoint: String,
        method: HTTPMethod = .GET,
        body: Data? = nil,
        requiresAuth: Bool = true
    ) -> URLRequest? {
        guard let url = URL(string: "\(baseURL)/\(endpoint)") else {
            return nil
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if requiresAuth, let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        if let body = body {
            request.httpBody = body
        }
        
        return request
    }
    
    // MARK: - Generic Request Method
    private func performRequest<T: Codable>(
        endpoint: String,
        method: HTTPMethod = .GET,
        body: Data? = nil,
        requiresAuth: Bool = true,
        responseType: T.Type
    ) -> AnyPublisher<T, Error> {
        guard let request = createRequest(
            endpoint: endpoint,
            method: method,
            body: body,
            requiresAuth: requiresAuth
        ) else {
            return Fail(error: APIError.invalidURL)
                .eraseToAnyPublisher()
        }
        
        return session.dataTaskPublisher(for: request)
            .map(\.data)
            .decode(type: responseType, decoder: JSONDecoder.apiDecoder)
            .catch { error -> AnyPublisher<T, Error> in
                if let decodingError = error as? DecodingError {
                    return Fail(error: APIError.decodingError(decodingError))
                        .eraseToAnyPublisher()
                } else if let urlError = error as? URLError {
                    return Fail(error: APIError.networkError(urlError))
                        .eraseToAnyPublisher()
                } else {
                    return Fail(error: error)
                        .eraseToAnyPublisher()
                }
            }
            .eraseToAnyPublisher()
    }
    
    // MARK: - Authentication
    func login(email: String, password: String) -> AnyPublisher<AuthResponse, Error> {
        let request = LoginRequest(email: email, password: password)
        
        guard let body = try? JSONEncoder().encode(request) else {
            return Fail(error: APIError.encodingError)
                .eraseToAnyPublisher()
        }
        
        return performRequest(
            endpoint: "auth/login",
            method: .POST,
            body: body,
            requiresAuth: false,
            responseType: AuthResponse.self
        )
        .handleEvents(receiveOutput: { [weak self] response in
            self?.authToken = response.token
        })
        .eraseToAnyPublisher()
    }
    
    func register(request: RegisterRequest) -> AnyPublisher<AuthResponse, Error> {
        guard let body = try? JSONEncoder().encode(request) else {
            return Fail(error: APIError.encodingError)
                .eraseToAnyPublisher()
        }
        
        return performRequest(
            endpoint: "auth/register",
            method: .POST,
            body: body,
            requiresAuth: false,
            responseType: AuthResponse.self
        )
        .handleEvents(receiveOutput: { [weak self] response in
            self?.authToken = response.token
        })
        .eraseToAnyPublisher()
    }
    
    func logout() {
        authToken = nil
        UserDefaults.standard.removeObject(forKey: "auth_token")
    }
    
    func getCurrentUser() -> AnyPublisher<User, Error> {
        return performRequest(
            endpoint: "auth/me",
            responseType: User.self
        )
    }
    
    // MARK: - Slots
    func getSlots(
        from startDate: Date? = nil,
        to endDate: Date? = nil,
        available: Bool? = nil
    ) -> AnyPublisher<SlotsResponse, Error> {
        var queryItems: [URLQueryItem] = []
        
        if let startDate = startDate {
            queryItems.append(URLQueryItem(name: "start", value: startDate.toISOString()))
        }
        
        if let endDate = endDate {
            queryItems.append(URLQueryItem(name: "end", value: endDate.toISOString()))
        }
        
        if let available = available {
            queryItems.append(URLQueryItem(name: "available", value: String(available)))
        }
        
        let endpoint = queryItems.isEmpty ? "slots" : "slots?\(queryItems.map { "\($0.name)=\($0.value ?? "")" }.joined(separator: "&"))"
        
        return performRequest(
            endpoint: endpoint,
            responseType: SlotsResponse.self
        )
    }
    
    func createSlots(request: CreateSlotsRequest) -> AnyPublisher<SlotsResponse, Error> {
        guard let body = try? JSONEncoder.apiEncoder.encode(request) else {
            return Fail(error: APIError.encodingError)
                .eraseToAnyPublisher()
        }
        
        return performRequest(
            endpoint: "slots/timeframe",
            method: .POST,
            body: body,
            responseType: SlotsResponse.self
        )
    }
    
    // MARK: - Bookings
    func getBookings() -> AnyPublisher<BookingsResponse, Error> {
        return performRequest(
            endpoint: "bookings",
            responseType: BookingsResponse.self
        )
    }
    
    func createBooking(request: CreateBookingRequest) -> AnyPublisher<BookingResponse, Error> {
        guard let body = try? JSONEncoder.apiEncoder.encode(request) else {
            return Fail(error: APIError.encodingError)
                .eraseToAnyPublisher()
        }
        
        return performRequest(
            endpoint: "bookings",
            method: .POST,
            body: body,
            responseType: BookingResponse.self
        )
    }
    
    func updateBooking(id: String, request: UpdateBookingRequest) -> AnyPublisher<BookingResponse, Error> {
        guard let body = try? JSONEncoder.apiEncoder.encode(request) else {
            return Fail(error: APIError.encodingError)
                .eraseToAnyPublisher()
        }
        
        return performRequest(
            endpoint: "bookings/\(id)",
            method: .PUT,
            body: body,
            responseType: BookingResponse.self
        )
    }
    
    func rescheduleBooking(id: String, request: RescheduleBookingRequest) -> AnyPublisher<BookingResponse, Error> {
        guard let body = try? JSONEncoder.apiEncoder.encode(request) else {
            return Fail(error: APIError.encodingError)
                .eraseToAnyPublisher()
        }
        
        return performRequest(
            endpoint: "bookings/\(id)/reschedule",
            method: .PUT,
            body: body,
            responseType: BookingResponse.self
        )
    }
    
    func cancelBooking(id: String) -> AnyPublisher<BookingResponse, Error> {
        return performRequest(
            endpoint: "bookings/\(id)",
            method: .DELETE,
            responseType: BookingResponse.self
        )
    }
    
    func getBookingICS(id: String) -> AnyPublisher<Data, Error> {
        guard let request = createRequest(endpoint: "bookings/\(id)/ics") else {
            return Fail(error: APIError.invalidURL)
                .eraseToAnyPublisher()
        }
        
        return session.dataTaskPublisher(for: request)
            .map(\.data)
            .mapError { error in
                APIError.networkError(error)
            }
            .eraseToAnyPublisher()
    }
    
    // MARK: - Messages
    func getMessages(filters: MessageFiltersRequest? = nil) -> AnyPublisher<MessagesResponse, Error> {
        var endpoint = "messages"
        
        if let filters = filters {
            var queryItems: [URLQueryItem] = []
            
            if let type = filters.type {
                queryItems.append(URLQueryItem(name: "type", value: type.rawValue))
            }
            
            if let unreadOnly = filters.unreadOnly {
                queryItems.append(URLQueryItem(name: "unread_only", value: String(unreadOnly)))
            }
            
            if let fromDate = filters.fromDate {
                queryItems.append(URLQueryItem(name: "from_date", value: fromDate.toISOString()))
            }
            
            if let toDate = filters.toDate {
                queryItems.append(URLQueryItem(name: "to_date", value: toDate.toISOString()))
            }
            
            if let limit = filters.limit {
                queryItems.append(URLQueryItem(name: "limit", value: String(limit)))
            }
            
            if let offset = filters.offset {
                queryItems.append(URLQueryItem(name: "offset", value: String(offset)))
            }
            
            if !queryItems.isEmpty {
                endpoint += "?" + queryItems.map { "\($0.name)=\($0.value ?? "")" }.joined(separator: "&")
            }
        }
        
        return performRequest(
            endpoint: endpoint,
            responseType: MessagesResponse.self
        )
    }
    
    func sendMessage(request: SendMessageRequest) -> AnyPublisher<MessageResponse, Error> {
        guard let body = try? JSONEncoder.apiEncoder.encode(request) else {
            return Fail(error: APIError.encodingError)
                .eraseToAnyPublisher()
        }
        
        return performRequest(
            endpoint: "messages",
            method: .POST,
            body: body,
            responseType: MessageResponse.self
        )
    }
    
    func replyToMessage(request: ReplyToMessageRequest) -> AnyPublisher<ReplyResponse, Error> {
        guard let body = try? JSONEncoder.apiEncoder.encode(request) else {
            return Fail(error: APIError.encodingError)
                .eraseToAnyPublisher()
        }
        
        return performRequest(
            endpoint: "messages/\(request.messageId)/reply",
            method: .POST,
            body: body,
            responseType: ReplyResponse.self
        )
    }
    
    // MARK: - File Upload
    func uploadFile(data: Data, filename: String, mimeType: String) -> AnyPublisher<FileUploadResponse, Error> {
        guard let url = URL(string: "\(baseURL)/uploads") else {
            return Fail(error: APIError.invalidURL)
                .eraseToAnyPublisher()
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        let body = createMultipartBody(data: data, filename: filename, mimeType: mimeType, boundary: boundary)
        request.httpBody = body
        
        return session.dataTaskPublisher(for: request)
            .map(\.data)
            .decode(type: FileUploadResponse.self, decoder: JSONDecoder.apiDecoder)
            .mapError { error in
                if let decodingError = error as? DecodingError {
                    return APIError.decodingError(decodingError)
                } else if let urlError = error as? URLError {
                    return APIError.networkError(urlError)
                } else {
                    return error
                }
            }
            .eraseToAnyPublisher()
    }
    
    private func createMultipartBody(data: Data, filename: String, mimeType: String, boundary: String) -> Data {
        var body = Data()
        
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(filename)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        body.append(data)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)
        
        return body
    }
    
    // MARK: - Profile
    func updateProfile(request: UpdateProfileRequest) -> AnyPublisher<User, Error> {
        guard let body = try? JSONEncoder.apiEncoder.encode(request) else {
            return Fail(error: APIError.encodingError)
                .eraseToAnyPublisher()
        }
        
        return performRequest(
            endpoint: "auth/profile",
            method: .PUT,
            body: body,
            responseType: User.self
        )
    }
}

// MARK: - HTTP Method
enum HTTPMethod: String {
    case GET = "GET"
    case POST = "POST"
    case PUT = "PUT"
    case DELETE = "DELETE"
    case PATCH = "PATCH"
}

// MARK: - API Errors
enum APIError: LocalizedError {
    case invalidURL
    case encodingError
    case decodingError(DecodingError)
    case networkError(URLError)
    case serverError(Int, String?)
    case unauthorized
    case unknown
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .encodingError:
            return "Failed to encode request"
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .serverError(let code, let message):
            return "Server error (\(code)): \(message ?? "Unknown error")"
        case .unauthorized:
            return "Unauthorized access"
        case .unknown:
            return "An unknown error occurred"
        }
    }
}

// MARK: - JSON Encoder/Decoder Extensions
extension JSONEncoder {
    static var apiEncoder: JSONEncoder {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.keyEncodingStrategy = .convertToSnakeCase
        return encoder
    }
}

extension JSONDecoder {
    static var apiDecoder: JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return decoder
    }
}