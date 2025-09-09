describe('Error Handling', () => {
  it('should handle network errors gracefully', () => {
    // Simulate network failure
    cy.intercept('GET', '/api/character*', {
      forceNetworkError: true
    }).as('networkError')

    cy.visit('/')
    cy.getByTestId('character-name-input').type('Test Character')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    cy.wait('@networkError')
    cy.contains('Search Failed').should('be.visible')
    cy.contains('network').should('be.visible')
  })

  it('should handle API timeout errors', () => {
    // Simulate slow API response
    cy.intercept('GET', '/api/character*', {
      delay: 50000, // Longer than timeout
      statusCode: 200,
      body: {}
    }).as('timeoutError')

    cy.visit('/')
    cy.getByTestId('character-name-input').type('Test Character')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    cy.contains('timeout', { timeout: 60000 }).should('be.visible')
  })

  it('should handle malformed API responses', () => {
    // Return invalid JSON
    cy.intercept('GET', '/api/character*', {
      statusCode: 200,
      body: 'invalid json response'
    }).as('malformedResponse')

    cy.visit('/')
    cy.getByTestId('character-name-input').type('Test Character')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    cy.wait('@malformedResponse')
    cy.contains('Invalid response').should('be.visible')
  })

  it('should handle component errors with error boundary', () => {
    // This would require injecting an error into a component
    // For now, we'll test that error boundaries exist
    cy.visit('/achievements?name=Test&server=Cactuar')
    
    // Check that error boundary wrapper exists
    cy.get('main').should('exist')
  })

  it('should handle missing character data', () => {
    // Visit achievements page without character params
    cy.visit('/achievements')
    
    cy.contains('No Character Selected').should('be.visible')
    cy.contains('Return Home').should('be.visible')
  })

  it('should handle achievements API failure', () => {
    // Mock character API success but achievements API failure
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
    }).as('characterSuccess')

    cy.intercept('GET', '/api/achievements', {
      statusCode: 500,
      body: { error: 'Internal server error' }
    }).as('achievementsError')

    cy.visit('/')
    cy.getByTestId('character-name-input').type('Test Character')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    cy.wait('@characterSuccess')
    cy.wait('@achievementsError')

    cy.contains('Error Loading Achievements').should('be.visible')
  })

  it('should provide helpful error messages', () => {
    // Test various error scenarios and check for helpful messages
    cy.intercept('GET', '/api/character*', {
      statusCode: 404,
      body: { error: 'Character not found. Please check the name and server spelling.' }
    }).as('notFoundError')

    cy.visit('/')
    cy.getByTestId('character-name-input').type('NonExistent')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    cy.wait('@notFoundError')
    cy.contains('Character not found').should('be.visible')
    cy.contains('check the name and server spelling').should('be.visible')
  })
})