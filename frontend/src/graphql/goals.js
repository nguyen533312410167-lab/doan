import { gql } from "@apollo/client";

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
      createdAt
    }
  }
`;

export const CREATE_SAVING_GOAL = gql`
  mutation CreateSavingGoal($name: String!, $targetAmount: String!, $dueDate: String!, $note: String) {
    createSavingGoal(name: $name, targetAmount: $targetAmount, dueDate: $dueDate, note: $note) {
      savingGoal {
        id
        name
        targetAmount
        currentAmount
        dueDate
        progressPercent
        daysLeft
      }
    }
  }
`;

export const UPDATE_SAVING_GOAL = gql`
  mutation UpdateSavingGoal($id: ID!, $name: String, $targetAmount: String, $currentAmount: String, $dueDate: String, $note: String, $isCompleted: Boolean) {
    updateSavingGoal(id: $id, name: $name, targetAmount: $targetAmount, currentAmount: $currentAmount, dueDate: $dueDate, note: $note, isCompleted: $isCompleted) {
      savingGoal {
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
  }
`;

export const DELETE_SAVING_GOAL = gql`
  mutation DeleteSavingGoal($id: ID!) {
    deleteSavingGoal(id: $id) {
      ok
      transaction {
        id
        amount
        note
        date
        type
        categoryName
      }
    }
  }
`;

export const DEPOSIT_TO_GOAL = gql`
  mutation DepositToGoal($goalId: ID!, $amount: String!) {
    depositToGoal(goalId: $goalId, amount: $amount) {
      savingGoal {
        id
        name
        targetAmount
        currentAmount
        isCompleted
        progressPercent
        daysLeft
      }
      transaction {
        id
        amount
        note
        date
      }
    }
  }
`;

export const WITHDRAW_FROM_GOAL = gql`
  mutation WithdrawFromGoal($goalId: ID!, $amount: String!, $date: String, $note: String) {
    withdrawFromGoal(goalId: $goalId, amount: $amount, date: $date, note: $note) {
      savingGoal {
        id
        name
        targetAmount
        currentAmount
        progressPercent
        daysLeft
      }
      transaction {
        id
        amount
        note
        date
        type
      }
    }
  }
`;

export const MONTHLY_SAVINGS = gql`
  query MonthlySavings($year: Int!) {
    monthlySavings(year: $year) {
      month
      savings
      deposit
      withdraw
    }
  }
`;