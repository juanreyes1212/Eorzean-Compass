describe('Character Search', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should display the character search form', () => {
    cy.getByTestId('character-name-input').should('be.visible')
    cy.getByTestId('server-select').should('be.visible')
    cy.getByTestId('search-button').should('be.visible')
  })

  it('should show validation errors for empty form', () => {
    cy.getByTestId('search-button').click()
    cy.contains('Character name is required').should('be.visible')
    cy.contains('Please select a server').should('be.visible')
  })

  it('should show validation error for short character name', () => {
    cy.getByTestId('character-name-input').type('A')
    cy.getByTestId('search-button').click()
    cy.contains('Character name must be at least 2 characters').should('be.visible')
  })

  it('should show validation error for long character name', () => {
    cy.getByTestId('character-name-input').type('ThisNameIsTooLongForFFXIV')
    cy.getByTestId('search-button').click()
    cy.contains('Character name must be 20 characters or less').should('be.visible')
  })

  it('should allow server selection', () => {
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('server-select').should('contain', 'Cactuar')
  })

  it('should handle successful character search and show success toast', () => {
    // Mock successful Tomestone.gg API search response
    cy.intercept('GET', 'https://tomestone.gg/api/character/search*', {
      statusCode: 200,
      body: {
        characters: [{
          id: '12345678',
          name: 'Digs Reynar',
          server: 'Cactuar',
          avatar: '/placeholder.svg',
        }]
      }
    }).as('tomestoneSearch');

    // Mock successful Tomestone.gg API character data response
    cy.intercept('GET', 'https://tomestone.gg/api/character/12345678?data=achievements', {
      statusCode: 200,
      body: {
        character: {
          id: '12345678',
          name: 'Digs Reynar',
          server: 'Cactuar',
          avatar: '/placeholder.svg',
          // Tomestone.gg might not provide these directly in this endpoint,
          // but our API route will estimate them.
          achievementPoints: 1000, 
          achievementsCompleted: 100,
          totalAchievements: 2500,
        },
        achievements: [
          { id: 1, date: '2023-01-01T00:00:00Z' },
          { id: 2, date: '2023-01-02T00:00:00Z' }
        ]
      }
    }).as('tomestoneCharacterData');

    cy.getByTestId('character-name-input').type('Digs Reynar')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    cy.wait('@tomestoneSearch')
    cy.wait('@tomestoneCharacterData')
    cy.url().should('include', '/achievements')
    cy.url().should('include', 'name=Digs%20Reynar')
    cy.url().should('include', 'server=Cactuar')
    cy.contains('Character Found!').should('be.visible')
    cy.contains('Successfully loaded data for Digs Reynar on Cactuar.').should('be.visible')
  })

  it('should handle character not found error and show error toast', () => {
    cy.intercept('GET', 'https://tomestone.gg/api/character/search*', {
      statusCode: 200, // Tomestone.gg might return 200 with empty results for not found
      body: { characters: [] }
    }).as('tomestoneNotFound');

    cy.getByTestId('character-name-input').type('NonExistent')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    cy.wait('@tomestoneNotFound')
    cy.contains('Search Failed').should('be.visible')
    cy.contains('Character not found. Please check the name and server spelling.').should('be.visible')
  })

  it('should show demo data toast when API returns mock data', () => {
    // Simulate Tomestone.gg API failure
    cy.intercept('GET', 'https://tomestone.gg/api/character/search*', {
      statusCode: 500,
      body: 'Internal Server Error'
    }).as('tomestoneSearchFail');

    cy.getByTestId('character-name-input').type('Demo User')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    cy.wait('@tomestoneSearchFail')
    cy.contains('Using Demo Data').should('be.visible')
    cy.contains('Tomestone.gg API unavailable').should('be.visible')
  })

  it('should clear validation errors when user types', () => {
    cy.getByTestId('search-button').click()
    cy.contains('Character name is required').should('be.visible')
    
    cy.getByTestId('character-name-input').type('Test')
    cy.contains('Character name is required').should('not.exist')
  })

  it('should clear server validation error when user selects server', () => {
    cy.getByTestId('search-button').click()
    cy.contains('Please select a server').should('be.visible')
    
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.contains('Please select a server').should('not.exist')
  })

  it('should show loading state during search', () => {
    cy.intercept('GET', 'https://tomestone.gg/api/character/search*', {
      delay: 2000,
      statusCode: 200,
      body: {
        characters: [{
          id: '12345678',
          name: 'Test Character',
          server: 'Cactuar',
          avatar: '/placeholder.svg',
        }]
      }
    }).as('slowTomestoneSearch');

    cy.intercept('GET', 'https://tomestone.gg/api/character/12345678?data=achievements', {
      delay: 2000,
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
        achievements: []
      }
    }).as('slowTomestoneCharacterData');

    cy.getByTestId('character-name-input').type('Test Character')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    cy.getByTestId('search-button').should('be.disabled')
    cy.getByTestId('search-button').should('contain', 'Searching...')
    cy.get('.animate-spin').should('be.visible')

    cy.wait('@slowTomestoneSearch')
    cy.wait('@slowTomestoneCharacterData')
  })
})