describe('Complete User Journey', () => {
  beforeEach(() => {
    // Mock all necessary APIs
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
        completedAchievements: [
          { id: 1 }, { id: 2 }, { id: 100 }, { id: 500 }
        ],
        _isMockData: false
      }
    }).as('characterApi')

    cy.intercept('GET', '/api/achievements', {
      fixture: 'achievements-tsrg.json'
    }).as('achievementsApi')
  })

  it('should complete full user workflow from search to recommendations', () => {
    // Step 1: Land on homepage
    cy.visit('/')
    cy.contains('Eorzean Compass').should('be.visible')
    cy.contains('TSR-G Matrix').should('be.visible')

    // Step 2: Search for character
    cy.getByTestId('character-name-input').type('Test Character')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    // Step 3: Verify navigation to achievements page
    cy.wait('@characterApi')
    cy.wait('@achievementsApi')
    cy.url().should('include', '/achievements')
    cy.url().should('include', 'name=Test%20Character')
    cy.url().should('include', 'server=Cactuar')

    // Step 4: Verify character profile loads
    cy.contains('Test Character').should('be.visible')
    cy.contains('Cactuar').should('be.visible')
    cy.contains('1,000').should('be.visible') // Achievement points

    // Step 5: Test TSR-G filters
    cy.get('[data-testid="time-slider"]').should('be.visible')
    cy.get('[data-testid="skill-slider"]').should('be.visible')
    cy.get('[data-testid="rng-slider"]').should('be.visible')
    cy.get('[data-testid="group-slider"]').should('be.visible')

    // Step 6: Apply filters and verify results change
    cy.get('[data-testid="tier-4-badge"]').click() // Deselect Apex tier
    cy.get('[data-testid="achievements-table-body"] tr').should('have.length.greaterThan', 0)

    // Step 7: Test recommendations
    cy.contains('Recommendations & Projects').click()
    cy.get('[data-testid="recommendation-card"]').should('have.length.greaterThan', 0)

    // Step 8: Test achievement projects
    cy.contains('Achievement Projects').click()
    cy.get('[data-testid="project-card"]').should('have.length.greaterThan', 0)

    // Step 9: Test project details
    cy.get('[data-testid="project-card"]').first().click()
    cy.contains('Achievements in this project:').should('be.visible')
    cy.get('button').contains('Close').click()

    // Step 10: Return to achievements and test search
    cy.contains('Your Achievements').click()
    cy.get('input[placeholder="Search achievements..."]').type('test')
    cy.url().should('include', 'query=test')

    // Step 11: Test achievement details
    cy.get('[data-testid="achievement-row-1"]').click()
    cy.get('[role="dialog"]').should('be.visible')
    cy.contains('TSR-G Difficulty:').should('be.visible')
  })

  it('should handle offline functionality', () => {
    // First load with network
    cy.visit('/')
    cy.getByTestId('character-name-input').type('Test Character')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    cy.wait('@characterApi')
    cy.wait('@achievementsApi')

    // Simulate going offline
    cy.window().then((win) => {
      cy.stub(win.navigator, 'onLine').value(false)
      win.dispatchEvent(new Event('offline'))
    })

    // Should show offline notification
    cy.contains('Offline Mode').should('be.visible')

    // Data should still be accessible from cache
    cy.get('[data-testid="achievements-table-body"] tr').should('have.length.greaterThan', 0)
  })

  it('should persist user preferences across sessions', () => {
    cy.visit('/achievements?name=Test%20Character&server=Cactuar')
    cy.wait('@characterApi')
    cy.wait('@achievementsApi')

    // Change preferences
    cy.get('[data-testid="time-slider"]').click()
    cy.get('[data-testid="hide-completed-switch"]').click()
    cy.get('[data-testid="tier-4-badge"]').click()

    // Reload page
    cy.reload()
    cy.wait('@characterApi')
    cy.wait('@achievementsApi')

    // Preferences should be preserved
    cy.get('[data-testid="hide-completed-switch"]').should('be.checked')
    cy.get('[data-testid="tier-4-badge"]').should('not.have.class', 'bg-red-500')
  })
})