import { ApolloClient, ApolloLink, InMemoryCache } from "@apollo/client";
import { createUploadLink } from "apollo-upload-client";

import { getToken } from "./auth.js";

const graphqlUrl = import.meta.env.VITE_GRAPHQL_URL || "http://localhost:8000/graphql/";

const authLink = new ApolloLink((operation, forward) => {
  const token = getToken();
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      authorization: token ? `JWT ${token}` : "",
    },
  }));
  return forward(operation);
});

const uploadLink = createUploadLink({
  uri: graphqlUrl,
});

export const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: ApolloLink.from([authLink, uploadLink]),
});

