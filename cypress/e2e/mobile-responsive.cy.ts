describe('Mobile Responsive Design', () => {
  const viewports = [
    { device: 'iPhone SE', width: 375, height: 667 },
    { device: 'iPad', width: 768, height: 1024 },
    { device: 'Desktop', width: 1280, height: 720 }
  ]

  viewports.forEach(({ device, width, height }) => {
    describe(`${device} (${width}x${height})`, () => {
      beforeEach(() => {
        cy.viewport(width, height)
        cy.visit('/')
      })

      it('should display properly on different screen sizes', () => {
        // Header should be visible and properly sized
        cy.get('header').should('be.visible')
        cy.contains('Eorzean Compass').should('be.visible')

        // Navigation should be accessible
        cy.get('nav').should('be.visible')

        // Character search form should be usable
        cy.getByTestId('character-name-input').should('be.visible')
        cy.getByTestId('server-select').should('be.visible')
        cy.getByTestId('search-button').should('be.visible')

        // Form should be properly sized
        cy.getByTestId('character-name-input').should('have.css', 'width').and('not.eq', '0px')
      })

      it('should handle character search on mobile', () => {
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
        }).as('characterApi')

        cy.intercept('GET', '/api/achievements', {
          fixture: 'achievements-tsrg.json'
        }).as('achievementsApi')

        cy.getByTestId('character-name-input').type('Test Character')
        cy.getByTestId('server-select').click()
        cy.getByTestId('server-option-Cactuar').click()
        cy.getByTestId('search-button').click()

        cy.wait('@characterApi')
        cy.wait('@achievementsApi')

        // Should navigate successfully
        cy.url().should('include', '/achievements')

        // Character profile should be responsive
        cy.contains('Test Character').should('be.visible')
        cy.contains('Cactuar').should('be.visible')
      })

      it('should make TSR-G filters usable on mobile', () => {
        cy.visit('/achievements?name=Test&server=Cactuar')

        // Filters should be visible and usable
        cy.get('[data-testid="time-slider"]').should('be.visible')
        cy.get('[data-testid="skill-slider"]').should('be.visible')

        // Should be able to interact with sliders
        cy.get('[data-testid="time-slider"]').click()

        // Tier badges should wrap properly
        cy.get('[data-testid="tier-1-badge"]').should('be.visible')
        cy.get('[data-testid="tier-2-badge"]').should('be.visible')
      })

      it('should make achievement table responsive', () => {
        cy.intercept('GET', '/api/achievements', {
          fixture: 'achievements-tsrg.json'
        }).as('achievementsApi')

        cy.visit('/achievements?name=Test&server=Cactuar')
        cy.wait('@achievementsApi')

        // Table should be scrollable horizontally on small screens
        if (width < 768) {
          cy.get('[data-testid="achievements-table"]').should('have.css', 'overflow-x', 'auto')
        }

        // Achievement rows should be visible
        cy.get('[data-testid="achievements-table-body"] tr').should('be.visible')
      })
    })
  })

  it('should handle touch interactions', () => {
    cy.viewport('iphone-6')
    cy.visit('/achievements?name=Test&server=Cactuar')

    // Should handle touch events on interactive elements
    cy.get('[data-testid="tier-1-badge"]').trigger('touchstart').trigger('touchend')
    cy.get('[data-testid="hide-completed-switch"]').trigger('touchstart').trigger('touchend')
  })
})