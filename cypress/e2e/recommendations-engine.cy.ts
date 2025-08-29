describe('Recommendations Engine', () => {
  beforeEach(() => {
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
          { id: 1 }, { id: 100 }, { id: 500 } // Mix of different tiers
        ],
        _isMockData: false
      }
    }).as('characterApi')

    cy.intercept('GET', '/api/achievements', {
      fixture: 'achievements-tsrg.json'
    }).as('achievementsApi')

    cy.visit('/achievements?name=Test%20Character&server=Cactuar')
    cy.wait('@characterApi')
    cy.wait('@achievementsApi')
  })

  it('should generate personalized recommendations based on user profile', () => {
    cy.contains('Recommendations & Projects').click()
    
    // Should show user profile analysis
    cy.contains('Your Achievement Profile').should('be.visible')
    cy.contains('Preferred Difficulty').should('be.visible')
    cy.contains('Average Skill Level').should('be.visible')

    // Should show recommendations
    cy.get('[data-testid="recommendation-card"]').should('have.length.greaterThan', 0)

    // Each recommendation should have TSR-G scores
    cy.get('[data-testid="recommendation-card"]').first().within(() => {
      cy.get('.text-orange-400').should('be.visible') // Time
      cy.get('.text-purple-400').should('be.visible') // Skill
      cy.get('.text-red-400').should('be.visible')    // RNG
      cy.get('.text-blue-400').should('be.visible')   // Group
    })

    // Should show recommendation reasons
    cy.get('[data-testid="recommendation-reason"]').should('have.length.greaterThan', 0)
  })

  it('should filter recommendations based on TSR-G preferences', () => {
    // Set restrictive time filter
    cy.get('[data-testid="time-slider"]').click().trigger('input', { target: { value: '3' } })
    
    cy.contains('Recommendations & Projects').click()
    
    // Recommendations should respect the time filter
    cy.get('[data-testid="recommendation-card"]').each(($card) => {
      cy.wrap($card).within(() => {
        // Time score should be 3 or less
        cy.get('.text-orange-400').next().should(($score) => {
          const score = parseInt($score.text())
          expect(score).to.be.at.most(3)
        })
      })
    })
  })

  it('should show achievement projects with progress tracking', () => {
    cy.contains('Recommendations & Projects').click()
    cy.contains('Achievement Projects').click()

    // Should show project cards
    cy.get('[data-testid="project-card"]').should('have.length.greaterThan', 0)

    // Each project should show progress
    cy.get('[data-testid="project-card"]').first().within(() => {
      cy.contains('Progress').should('be.visible')
      cy.get('[role="progressbar"]').should('be.visible')
      cy.contains('achievements').should('be.visible')
      cy.contains('points').should('be.visible')
    })
  })

  it('should open project details and show constituent achievements', () => {
    cy.contains('Recommendations & Projects').click()
    cy.contains('Achievement Projects').click()

    cy.get('[data-testid="project-card"]').first().click()

    // Should open modal with project details
    cy.get('[role="dialog"]').should('be.visible')
    cy.contains('Achievements in this project:').should('be.visible')

    // Should show individual achievements in project
    cy.get('.bg-slate-700').should('have.length.greaterThan', 0)

    // Should be able to close modal
    cy.contains('Close').click()
    cy.get('[role="dialog"]').should('not.exist')
  })

  it('should handle recommendation clicks and navigate to achievement', () => {
    cy.contains('Recommendations & Projects').click()
    
    // Click on a recommendation
    cy.get('[data-testid="recommendation-card"]').first().click()

    // Should switch to achievements tab
    cy.contains('Your Achievements').should('have.attr', 'data-state', 'active')

    // Should highlight the achievement (this would need specific implementation)
    // For now, just verify we're on the achievements tab
    cy.get('[data-testid="achievements-table"]').should('be.visible')
  })

  it('should show user strengths based on completed achievements', () => {
    cy.contains('Recommendations & Projects').click()

    // Should analyze user's completion pattern and show strengths
    cy.contains('Your Strengths:').should('be.visible')
    cy.get('.bg-blue-900').should('have.length.greaterThan', 0)
  })

  it('should update recommendations when preferences change', () => {
    cy.contains('Recommendations & Projects').click()
    
    // Get initial recommendation count
    cy.get('[data-testid="recommendation-card"]').then(($cards) => {
      const initialCount = $cards.length

      // Change preferences to be more restrictive
      cy.get('[data-testid="skill-slider"]').click().trigger('input', { target: { value: '2' } })
      cy.get('[data-testid="tier-3-badge"]').click()
      cy.get('[data-testid="tier-4-badge"]').click()

      // Should have fewer recommendations
      cy.get('[data-testid="recommendation-card"]').should('have.length.lessThan', initialCount)
    })
  })
})