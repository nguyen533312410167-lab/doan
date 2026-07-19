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
      action
      actionDisplay
      amount
      note
      date
      categoryName
      savingGoalName
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
  mutation CreateTransaction($transactionType: String!, $amount: String!, $date: String!, $categoryId: ID, $savingGoalId: ID, $action: String, $note: String) {
    createTransaction(transactionType: $transactionType, amount: $amount, date: $date, categoryId: $categoryId, savingGoalId: $savingGoalId, action: $action, note: $note) {
      transaction {
        id
        type
        action
        amount
        note
        date
        categoryName
        savingGoalName
        category {
          id
          nameVi
        }
      }
    }
  }
`;

export const UPDATE_TRANSACTION = gql`
  mutation UpdateTransaction($id: ID!, $transactionType: String, $amount: String, $date: String, $categoryId: ID, $savingGoalId: ID, $action: String, $note: String) {
    updateTransaction(id: $id, transactionType: $transactionType, amount: $amount, date: $date, categoryId: $categoryId, savingGoalId: $savingGoalId, action: $action, note: $note) {
      transaction {
        id
        type
        action
        amount
        note
        date
        categoryName
        savingGoalName
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

export const SAVING_GOALS = gql`
  query SavingGoals {
    savingGoals {
      id
      name
      targetAmount
      currentAmount
      dueDate
      note
      isCompleted
      progressPercent
      daysLeft
    }
  }
`;
