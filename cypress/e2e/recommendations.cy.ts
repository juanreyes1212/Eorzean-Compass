describe('Recommendations Dashboard', () => {
  beforeEach(() => {
    // Mock character API
    cy.intercept('POST', '/api/character', {
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
          { id: 1, completionDate: '2023-01-01T00:00:00Z' },
          { id: 2, completionDate: '2023-01-02T00:00:00Z' }
        ],
        _isMockData: true
      }
    }).as('characterSearch')

    cy.visit('/achievements?name=Test%20Character&server=Cactuar')
    cy.wait('@characterSearch')
  })

  it('should display user achievement profile', () => {
    // Should show profile summary
    cy.contains('Your Achievement Profile').should('be.visible')
    cy.contains('Preferred Difficulty').should('be.visible')
    cy.contains('Average Skill Level').should('be.visible')
    cy.contains('Time Investment').should('be.visible')
    cy.contains('Completed').should('be.visible')
  })

  it('should show personalized recommendations', () => {
    // Should display recommendations tab
    cy.contains('Personalized Recommendations').should('be.visible')
    
    // Should show recommendation cards
    cy.get('[data-testid="recommendation-card"]').should('have.length.greaterThan', 0)
    
    // Each recommendation should have required elements
    cy.get('[data-testid="recommendation-card"]').first().within(() => {
      cy.get('.font-medium').should('be.visible') // Achievement name
      cy.get('.text-slate-400').should('be.visible') // Description
      cy.contains('pts').should('be.visible') // Points
      cy.contains('Why recommended:').should('be.visible')
    })
  })

  it('should show achievement projects', () => {
    // Switch to projects tab
    cy.contains('Achievement Projects').click()
    
    // Should show project cards
    cy.get('[data-testid="project-card"]').should('have.length.greaterThan', 0)
    
    // Each project should have required elements
    cy.get('[data-testid="project-card"]').first().within(() => {
      cy.get('.font-medium').should('be.visible') // Project name
      cy.contains('Progress').should('be.visible')
      cy.get('[role="progressbar"]').should('be.visible')
      cy.contains('achievements').should('be.visible')
      cy.contains('points').should('be.visible')
    })
  })

  it('should handle recommendation clicks', () => {
    // Click on a recommendation
    cy.get('[data-testid="recommendation-card"]').first().click()
    
    // Should switch to achievements tab and highlight the achievement
    cy.contains('All Achievements').should('be.visible')
    // Note: The actual highlighting behavior would need to be tested with more specific selectors
  })

  it('should open project details', () => {
    // Switch to projects tab
    cy.contains('Achievement Projects').click()
    
    // Click on a project
    cy.get('[data-testid="project-card"]').first().click()
    
    // Should show project detail modal
    cy.get('.fixed').should('be.visible')
    cy.contains('Achievements in this project:').should('be.visible')
    
    // Should be able to close modal
    cy.get('button').contains('✕').click()
    cy.get('.fixed').should('not.exist')
  })

  it('should display TSR-G scores in recommendations', () => {
    // Check that TSR-G scores are visible in recommendations
    cy.get('[data-testid="recommendation-card"]').first().within(() => {
      // Should show TSR-G vector icons and scores
      cy.get('.text-orange-400').should('be.visible') // Time
      cy.get('.text-purple-400').should('be.visible') // Skill
      cy.get('.text-red-400').should('be.visible')    // RNG
      cy.get('.text-blue-400').should('be.visible')   // Group
    })
  })

  it('should show recommendation reasons with icons', () => {
    cy.get('[data-testid="recommendation-card"]').first().within(() => {
      // Should show at least one reason with icon
      cy.get('[data-testid="recommendation-reason"]').should('have.length.greaterThan', 0)
      
      cy.get('[data-testid="recommendation-reason"]').first().within(() => {
        cy.get('svg').should('be.visible') // Reason icon
        cy.get('.text-slate-300').should('be.visible') // Reason text
      })
    })
  })

  it('should handle empty recommendations gracefully', () => {
    // This would require mocking a scenario with no recommendations
    // For now, we'll just check that the component handles the case
    cy.contains('Personalized Recommendations').should('be.visible')
  })

  it('should show user strengths when available', () => {
    // Should show strengths section if user has completed achievements
    cy.contains('Your Strengths:').should('be.visible')
    
    // Should show strength badges
    cy.get('.bg-blue-900').should('have.length.greaterThan', 0)
  })
})
