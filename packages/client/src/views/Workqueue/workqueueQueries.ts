import { gql } from '@apollo/client'

const EVENT_SEARCH_RESULT_FIELDS = gql`
  fragment EventSearchFields on EventSearchSet {
    id
    type
    registration {
      status
      contactRelationship
      contactNumber
      trackingId
      eventLocationId
      registrationNumber
      registeredLocationId
      duplicates
      createdAt
      modifiedAt
      assignment {
        practitionerId
        firstName
        lastName
        officeName
        avatarURL
      }
    }
    operationHistories {
      operationType
      operatedOn
    }
    ... on BirthEventSearchSet {
      dateOfBirth
      childName {
        firstNames
        middleName
        familyName
        use
      }
    }
    ... on DeathEventSearchSet {
      dateOfDeath
      deceasedName {
        firstNames
        middleName
        familyName
        use
      }
    }
    ... on MarriageEventSearchSet {
      dateOfMarriage
      brideName {
        firstNames
        middleName
        familyName
        use
      }
      groomName {
        firstNames
        middleName
        familyName
        use
      }
    }
  }
`

export const WORKQUEUE_QUERY = gql`
  ${EVENT_SEARCH_RESULT_FIELDS}

  query registrationHome(
    $advancedSearchParameters: AdvancedSearchParametersInput!
    $count: Int!
    $skip: Int!
  ) {
    searchEvents(
      advancedSearchParameters: $advancedSearchParameters
      count: $pageSize
      skip: $skip
    ) {
      totalItems
      results {
        ...EventSearchFields
      }
    }
  }
`
