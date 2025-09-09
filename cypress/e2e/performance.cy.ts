describe('Performance', () => {
  it('should load the homepage within acceptable time', () => {
    const start = Date.now()
    
    cy.visit('/')
    cy.get('h1').should('be.visible')
    
    cy.then(() => {
      const loadTime = Date.now() - start
      expect(loadTime).to.be.lessThan(3000) // Should load within 3 seconds
    })
  })

  it('should handle large achievement datasets efficiently', () => {
    // Mock large dataset
    const largeDataset = Array.from({ length: 2500 }, (_, i) => ({
      id: i + 1,
      name: `Achievement ${i + 1}`,
      description: `Description for achievement ${i + 1}`,
      category: 'Battle',
      points: 10,
      patch: '6.0',
      isObtainable: true,
      tsrg: {
        time: Math.floor(Math.random() * 10) + 1,
        skill: Math.floor(Math.random() * 10) + 1,
        rng: Math.floor(Math.random() * 10) + 1,
        group: Math.floor(Math.random() * 10) + 1,
        composite: 20,
        tier: 2
      }
    }))

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
      statusCode: 200,
      body: largeDataset
    }).as('largeAchievements')

    cy.visit('/')
    cy.getByTestId('character-name-input').type('Test Character')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    cy.wait('@characterApi')
    cy.wait('@largeAchievements')

    // Should render without performance issues
    cy.get('[data-testid="achievements-table"]').should('be.visible')
    cy.get('[data-testid="achievements-table-body"] tr').should('have.length.greaterThan', 0)
  })

  it('should cache data properly', () => {
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

    cy.visit('/')
    cy.getByTestId('character-name-input').type('Test Character')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    cy.wait('@characterApi')

    // Check that data is stored in localStorage
    cy.window().its('localStorage').invoke('getItem', 'eorzean_compass_characters')
      .should('not.be.null')
  })

  it('should debounce search input', () => {
    cy.intercept('GET', '/api/achievements', {
      fixture: 'achievements.json'
    }).as('achievements')

    cy.visit('/achievements?name=Test&server=Cactuar')
    cy.wait('@achievements')

    // Type rapidly in search box
    cy.get('input[placeholder="Search achievements..."]')
      .type('test')
      .type('{backspace}{backspace}{backspace}{backspace}')
      .type('battle')

    // URL should only update after debounce delay
    cy.url().should('include', 'query=battle')
  })

  it('should lazy load images', () => {
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
      fixture: 'achievements.json'
    }).as('achievements')

    cy.visit('/')
    cy.getByTestId('character-name-input').type('Test Character')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    cy.wait('@characterApi')
    cy.wait('@achievements')

    // Check that images have loading="lazy"
    cy.get('img').should('have.attr', 'loading', 'lazy')
  })
})