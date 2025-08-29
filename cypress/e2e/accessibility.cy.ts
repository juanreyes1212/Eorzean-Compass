describe('Accessibility', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should have proper heading hierarchy', () => {
    // Check that headings follow proper hierarchy (h1 -> h2 -> h3, etc.)
    cy.get('h1').should('exist')
    cy.get('h1').should('contain', 'Eorzean Compass')
    
    // Check that there's only one h1 per page
    cy.get('h1').should('have.length', 1)
  })

  it('should have proper form labels', () => {
    // All form inputs should have associated labels
    cy.get('input').each(($input) => {
      const id = $input.attr('id')
      if (id) {
        cy.get(`label[for="${id}"]`).should('exist')
      }
    })
  })

  it('should have proper ARIA attributes', () => {
    // Check for proper ARIA labels on interactive elements
    cy.get('button').each(($button) => {
      const text = $button.text().trim()
      const ariaLabel = $button.attr('aria-label')
      
      // Button should have either text content or aria-label
      expect(text || ariaLabel).to.not.be.empty
    })
  })

  it('should support keyboard navigation', () => {
    // Tab through interactive elements
    cy.get('body').trigger('keydown', { key: 'Tab' })
    cy.focused().should('be.visible')
    
    // Test Enter key on buttons
    cy.getByTestId('search-button').focus().type('{enter}')
    // Should show validation errors
    cy.contains('Character name is required').should('be.visible')
  })

  it('should have proper color contrast', () => {
    // Check that text has sufficient contrast
    cy.get('.text-compass-100').should('be.visible')
    cy.get('.text-compass-300').should('be.visible')
    
    // Check that interactive elements have proper focus indicators
    cy.getByTestId('character-name-input').focus()
    cy.focused().should('have.css', 'outline-style', 'solid')
  })

  it('should announce important changes to screen readers', () => {
    // Check for aria-live regions
    cy.get('[aria-live]').should('exist')
    
    // Test form validation announcements
    cy.getByTestId('search-button').click()
    cy.get('[role="alert"]').should('exist')
  })

  it('should have proper table accessibility', () => {
    // Navigate to achievements page with mock data
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
        _isMockData: true
      }
    }).as('characterApi')

    cy.intercept('GET', '/api/achievements', {
      fixture: 'achievements.json'
    }).as('achievementsApi')

    cy.getByTestId('character-name-input').type('Test Character')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    cy.wait('@characterApi')
    cy.wait('@achievementsApi')

    // Check table accessibility
    cy.get('table').should('have.attr', 'role', 'table')
    cy.get('th').should('have.attr', 'scope', 'col')
    cy.get('tbody tr').first().should('have.attr', 'role', 'button')
  })

  it('should support screen reader navigation', () => {
    // Check for proper landmarks
    cy.get('main').should('exist')
    cy.get('nav').should('exist')
    cy.get('header').should('exist')
    cy.get('footer').should('exist')
    
    // Check for skip links
    cy.get('a[href="#main-content"]').should('exist')
  })
})