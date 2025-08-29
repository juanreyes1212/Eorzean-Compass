describe('Error Boundary Testing', () => {
  it('should catch and display component errors', () => {
    // Simulate a component error by intercepting with malformed data
    cy.intercept('GET', '/api/character*', {
      statusCode: 200,
      body: {
        character: null, // This should cause an error
        completedAchievements: [],
        _isMockData: false
      }
    }).as('malformedCharacterApi')

    cy.visit('/')
    cy.getByTestId('character-name-input').type('Test Character')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    cy.wait('@malformedCharacterApi')

    // Should show error state instead of crashing
    cy.get('[data-testid="error-state"]').should('be.visible')
    cy.contains('Error Loading Character').should('be.visible')
  })

  it('should provide retry functionality in error states', () => {
    cy.intercept('GET', '/api/character*', {
      statusCode: 500,
      body: { error: 'Server error' }
    }).as('serverError')

    cy.visit('/')
    cy.getByTestId('character-name-input').type('Test Character')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    cy.wait('@serverError')

    // Should show retry button
    cy.get('[data-testid="error-state"]').should('be.visible')
    cy.contains('Try Again').should('be.visible')

    // Mock successful retry
    cy.intercept('GET', '/api/character*', {
      statusCode: 200,
      body: {
        character: {
          id: '12345678',
          name: 'Test Character',
          server: 'Cactuar',
          avatar: '/placeholder.svg',
          achievementPoints: 1000,
          achievementsCompleted: 100,
          totalAchievements: 2500,
        },
        completedAchievements: [],
        _isMockData: false
      }
    }).as('retrySuccess')

    cy.contains('Try Again').click()
    cy.wait('@retrySuccess')

    // Should navigate to achievements page
    cy.url().should('include', '/achievements')
  })

  it('should handle network errors gracefully', () => {
    cy.intercept('GET', '/api/character*', {
      forceNetworkError: true
    }).as('networkError')

    cy.visit('/')
    cy.getByTestId('character-name-input').type('Test Character')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    cy.wait('@networkError')

    // Should show network-specific error message
    cy.contains('Search Failed').should('be.visible')
    cy.contains('network').should('be.visible')
  })
})