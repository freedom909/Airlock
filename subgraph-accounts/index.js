import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { buildSubgraphSchema } from '@apollo/subgraph'
import { readFileSync } from 'fs'
import axios from 'axios'
import gql from 'graphql-tag'
import paseto from 'paseto';
const { V2 } = paseto;
import express from 'express'
import cors from 'cors'
import AuthAPI from './datasources/auth.js'

// import { getToken, handleInvalidToken } from '../infrastructure/helpers/tokens.js'
import { AuthenticationError }  from '../infrastructure/utils/errors.js'

const typeDefs = gql(readFileSync('./schema.graphql', { encoding: 'utf-8' }))
import resolvers from './resolvers.js'
import AccountsAPI from './datasources/accounts.js'

const httpClient = axios.create({
  baseURL: 'http://localhost:4002'
})
const app = express()
app.use(express.json())

// Use paseto as a middleware  
app.use(async (req, res, next) => {
  const token = req.headers['authorization']
  if (token) {
    try {
      const payload = await V2.verify(token, process.env.PASETO_SECRET)
      req.user = payload //attach the payload to the request object
    } catch (error) {
      console.error('Invalid token:', err.message)
    }
  }
  next();
})

if (process.env.NODE_ENV === 'development') {
  app.use(
    cors({
      origin: ['https://studio.apollographql.com', 'http://localhost:4002']
    })
  )
}

async function startApolloServer() {
  const server = new ApolloServer({
    schema: buildSubgraphSchema({
      typeDefs,
      resolvers
    }),
    // Other ApolloServer configurations...
    dataSources: () => ({
      accountsAPI: new AccountsAPI(),
      authAPI: new AuthAPI() // Pass the HTTP client to the AuthAPI data source
    }),
  
  })

  const port = 4002
  const subgraphName = 'accounts'

  try {
    const { url } = await startStandaloneServer(server, {
      context: async ({ req }) => {
        const token = req.headers.authorization || ''

        const userId = token.split(' ')[1] // get the user name after 'Bearer '

        let userInfo = {}
        if (userId) {
          const { data } = await axios
            .get(`http://localhost:4011/login/${userId}`)
            .catch(error => {
              throw AuthenticationError('you can not login with userId')
            })

          userInfo = { userId: data.id, userRole: data.role }
        }
        const { cache } = server

        return {
          ...userInfo,
        }
      },
      listen: {
        port
      }
    })

    console.log(`🚀 Subgraph ${subgraphName} running at ${url}`)
  } catch (err) {
    console.error(err)
  }
}

startApolloServer()
