describe('Achievements Page', () => {
  beforeEach(() => {
    // Mock the achievements API
    cy.intercept('GET', '/api/achievements', {
      fixture: 'achievements.json'
    }).as('getAchievements')
  })

  it('should redirect to home when no character is specified', () => {
    cy.visit('/achievements')
    cy.contains('No Character Selected').should('be.visible')
    cy.contains('Return Home').should('be.visible')
  })

  it('should display character profile and achievements', () => {
    cy.visit('/achievements?name=Test%20Character&server=Cactuar')
    
    cy.wait('@getAchievements')
    
    // Check character profile is displayed
    cy.contains('Test Character').should('be.visible')
    cy.contains('Cactuar').should('be.visible')
    
    // Check achievements table is displayed
    cy.getByTestId('achievements-table-body').should('be.visible')
  })

  it('should handle achievements loading error', () => {
    cy.intercept('GET', '/api/achievements', {
      statusCode: 500,
      body: { error: 'Failed to fetch achievements' }
    }).as('getAchievementsError')

    cy.visit('/achievements?name=Test%20Character&server=Cactuar')
    
    cy.wait('@getAchievementsError')
    
    cy.getByTestId('error-state').should('be.visible')
    cy.contains('Failed to load achievements').should('be.visible')
  })

  it('should show loading state while fetching achievements', () => {
    cy.intercept('GET', '/api/achievements', {
      delay: 2000,
      fixture: 'achievements.json'
    }).as('slowAchievements')

    cy.visit('/achievements?name=Test%20Character&server=Cactuar')
    
    cy.getByTestId('loading-state').should('be.visible')
    cy.contains('Loading achievements...').should('be.visible')
    
    cy.wait('@slowAchievements')
    cy.getByTestId('loading-state').should('not.exist')
  })

  it('should filter achievements by category', () => {
    cy.visit('/achievements?name=Test%20Character&server=Cactuar')
    cy.wait('@getAchievements')
    
    // Select a category filter
    cy.get('[data-testid="category-filter"]').click()
    cy.contains('Battle').click()
    
    // URL should update with category filter
    cy.url().should('include', 'category=battle')
  })

  it('should search achievements by name', () => {
    cy.visit('/achievements?name=Test%20Character&server=Cactuar')
    cy.wait('@getAchievements')
    
    // Type in search box
    cy.get('input[placeholder="Search achievements..."]').type('test achievement')
    
    // URL should update with search query
    cy.url().should('include', 'query=test%20achievement')
  })

  it('should toggle unobtainable achievements visibility', () => {
    cy.visit('/achievements?name=Test%20Character&server=Cactuar')
    cy.wait('@getAchievements')
    
    // Toggle the checkbox
    cy.getByTestId('show-unobtainable-checkbox').click()
    
    // Should show unobtainable achievements
    cy.contains('Unobtainable').should('be.visible')
  })
})
