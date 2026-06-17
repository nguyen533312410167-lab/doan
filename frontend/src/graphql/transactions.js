import { gql } from "@apollo/client";

export const CATEGORIES = gql`
  query Categories($type: String) {
    categories(type: $type) {
      id
      name
      nameVi
      type
      icon
      sortOrder
    }
  }
`;

export const TRANSACTIONS = gql`
  query Transactions($type: String, $categoryId: ID, $month: Int, $year: Int, $search: String, $limit: Int, $offset: Int) {
    transactions(type: $type, categoryId: $categoryId, month: $month, year: $year, search: $search, limit: $limit, offset: $offset) {
      id
      type
      amount
      note
      date
      categoryName
      category {
        id
        nameVi
        name
      }
      createdAt
    }
  }
`;

export const CREATE_TRANSACTION = gql`
  mutation CreateTransaction($transactionType: String!, $amount: String!, $date: String!, $categoryId: ID, $note: String) {
    createTransaction(transactionType: $transactionType, amount: $amount, date: $date, categoryId: $categoryId, note: $note) {
      transaction {
        id
        type
        amount
        note
        date
        categoryName
        category {
          id
          nameVi
        }
      }
    }
  }
`;

export const UPDATE_TRANSACTION = gql`
  mutation UpdateTransaction($id: ID!, $transactionType: String, $amount: String, $date: String, $categoryId: ID, $note: String) {
    updateTransaction(id: $id, transactionType: $transactionType, amount: $amount, date: $date, categoryId: $categoryId, note: $note) {
      transaction {
        id
        type
        amount
        note
        date
        categoryName
        category {
          id
          nameVi
        }
      }
    }
  }
`;

export const DELETE_TRANSACTION = gql`
  mutation DeleteTransaction($id: ID!) {
    deleteTransaction(id: $id) {
      ok
    }
  }
`;

export const MONTHLY_STATS = gql`
  query MonthlyStats($year: Int!) {
    monthlyStats(year: $year)
  }
`;