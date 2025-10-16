const { PrismaClient } = require('@prisma/client')

async function checkDatabase() {
  const prisma = new PrismaClient()
  
  try {
    // Try to connect to the database
    await prisma.$connect()
    console.log('Successfully connected to database')
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1`
    console.log('Successfully executed query:', result)
    
    return true
  } catch (error) {
    console.error('Database connection error:', error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase().then(success => {
  if (!success) {
    process.exit(1)
  }
})