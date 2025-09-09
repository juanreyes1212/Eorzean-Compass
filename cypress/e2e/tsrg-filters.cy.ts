describe('TSR-G Filters', () => {
  beforeEach(() => {
    // Mock the achievements API with TSR-G data
    cy.intercept('GET', '/api/achievements', {
      fixture: 'achievements-tsrg.json'
    }).as('getAchievements')

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
        completedAchievements: [],
        _isMockData: true
      }
    }).as('characterSearch')

    cy.visit('/achievements?name=Test%20Character&server=Cactuar')
    cy.wait('@characterSearch')
  })

  it('should display TSR-G filter controls', () => {
    // Check that all TSR-G sliders are present
    cy.get('[data-testid="time-slider"]').should('be.visible')
    cy.get('[data-testid="skill-slider"]').should('be.visible')
    cy.get('[data-testid="rng-slider"]').should('be.visible')
    cy.get('[data-testid="group-slider"]').should('be.visible')

    // Check tier badges
    cy.get('[data-testid="tier-1-badge"]').should('be.visible').should('contain', 'Foundational')
    cy.get('[data-testid="tier-2-badge"]').should('be.visible').should('contain', 'Systematic')
    cy.get('[data-testid="tier-3-badge"]').should('be.visible').should('contain', 'Dedicated')
    cy.get('[data-testid="tier-4-badge"]').should('be.visible').should('contain', 'Apex')

    // Check toggle switches
    cy.get('[data-testid="hide-completed-switch"]').should('be.visible')
    cy.get('[data-testid="hide-unobtainable-switch"]').should('be.visible')
  })

  it('should filter achievements by time score', () => {
    // Set time filter to low value
    cy.get('[data-testid="time-slider"]').click()
    
    // Should show fewer achievements
    cy.get('[data-testid="achievements-table-body"] tr').should('have.length.lessThan', 100)
  })

  it('should filter achievements by difficulty tier', () => {
    // Deselect Tier 4 (Apex)
    cy.get('[data-testid="tier-4-badge"]').click()
    
    // Should not show any Tier 4 achievements
    cy.get('[data-testid="achievements-table-body"]').should('not.contain', 'Apex')
  })

  it('should hide completed achievements when toggled', () => {
    // Toggle hide completed
    cy.get('[data-testid="hide-completed-switch"]').click()
    
    // Should not show any completed achievements
    cy.get('[data-testid="achievements-table-body"]').should('not.contain', 'Completed')
  })

  it('should reset filters when reset button is clicked', () => {
    // Change some filters first
    cy.get('[data-testid="tier-4-badge"]').click()
    cy.get('[data-testid="hide-completed-switch"]').click()
    
    // Click reset
    cy.contains('Reset').click()
    
    // All tiers should be selected again
    cy.get('[data-testid="tier-4-badge"]').should('have.class', 'bg-red-500')
    
    // Hide completed should be off
    cy.get('[data-testid="hide-completed-switch"]').should('not.be.checked')
  })

  it('should display TSR-G scores in achievement table', () => {
    // Check that TSR-G scores are displayed
    cy.get('[data-testid="achievements-table-body"] tr').first().within(() => {
      // Should show individual vector scores
      cy.get('.text-orange-400').should('be.visible') // Time icon
      cy.get('.text-purple-400').should('be.visible') // Skill icon
      cy.get('.text-red-400').should('be.visible')    // RNG icon
      cy.get('.text-blue-400').should('be.visible')   // Group icon
      
      // Should show tier badge
      cy.get('.bg-green-500, .bg-blue-500, .bg-yellow-500, .bg-red-500').should('be.visible')
    })
  })

  it('should show statistics dashboard', () => {
    // Check completion rate
    cy.contains('Completion Rate').should('be.visible')
    cy.get('[role="progressbar"]').should('be.visible')
    
    // Check other stats
    cy.contains('Completed').should('be.visible')
    cy.contains('Obtainable').should('be.visible')
    cy.contains('Filtered Results').should('be.visible')
  })

  it('should update filtered results count when filters change', () => {
    // Get initial count
    cy.contains('Filtered Results').parent().find('.text-2xl').then(($count) => {
      const initialCount = parseInt($count.text())
      
      // Apply a restrictive filter
      cy.get('[data-testid="tier-1-badge"]').click()
      cy.get('[data-testid="tier-2-badge"]').click()
      cy.get('[data-testid="tier-3-badge"]').click()
      
      // Count should be lower
      cy.contains('Filtered Results').parent().find('.text-2xl').should(($newCount) => {
        expect(parseInt($newCount.text())).to.be.lessThan(initialCount)
      })
    })
  })
})
