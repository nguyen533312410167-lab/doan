import { gql } from "@apollo/client";

export const USER_FIELDS = gql`
  fragment UserFields on UserType {
    id
    username
    email
    firstName
    lastName
    isActive
    isStaff
    dateJoined
    lastLogin
    profile {
      id
      phone
      address
      avatarUrl
    }
  }
`;

export const LOGIN = gql`
  mutation Login($username: String!, $password: String!) {
    tokenAuth(username: $username, password: $password) {
      token
      payload
    }
  }
`;

export const REGISTER = gql`
  mutation Register($username: String!, $email: String!, $password: String!, $firstName: String, $lastName: String) {
    register(username: $username, email: $email, password: $password, firstName: $firstName, lastName: $lastName) {
      user {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`;

export const ME = gql`
  query Me {
    me {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

export const USERS = gql`
  query Users($search: String) {
    users(search: $search) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

export const CREATE_USER = gql`
  mutation CreateUser(
    $username: String!
    $email: String!
    $password: String!
    $firstName: String
    $lastName: String
    $isActive: Boolean
    $isStaff: Boolean
  ) {
    createUser(
      username: $username
      email: $email
      password: $password
      firstName: $firstName
      lastName: $lastName
      isActive: $isActive
      isStaff: $isStaff
    ) {
      user {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`;

export const UPDATE_USER = gql`
  mutation UpdateUser(
    $id: ID!
    $email: String
    $firstName: String
    $lastName: String
    $isActive: Boolean
    $isStaff: Boolean
    $phone: String
    $address: String
  ) {
    updateUser(
      id: $id
      email: $email
      firstName: $firstName
      lastName: $lastName
      isActive: $isActive
      isStaff: $isStaff
      phone: $phone
      address: $address
    ) {
      user {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`;

export const UPDATE_ME = gql`
  mutation UpdateMe($email: String, $firstName: String, $lastName: String, $phone: String, $address: String) {
    updateMe(email: $email, firstName: $firstName, lastName: $lastName, phone: $phone, address: $address) {
      user {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`;

export const UPLOAD_AVATAR = gql`
  mutation UploadAvatar($file: Upload!, $userId: ID) {
    uploadAvatar(file: $file, userId: $userId) {
      user {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`;

export const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id) {
      ok
    }
  }
`;

