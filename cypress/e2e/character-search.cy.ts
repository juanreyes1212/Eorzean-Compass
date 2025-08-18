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
    // Mock successful API response
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
        completedAchievements: []
      }
    }).as('characterSearch')

    cy.getByTestId('character-name-input').type('Test Character')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    cy.wait('@characterSearch')
    cy.url().should('include', '/achievements')
    cy.url().should('include', 'name=Test%20Character')
    cy.url().should('include', 'server=Cactuar')
    cy.contains('Character Found!').should('be.visible')
    cy.contains('Successfully loaded data for Test Character on Cactuar.').should('be.visible')
  })

  it('should handle character not found error and show error toast', () => {
    cy.intercept('POST', '/api/character', {
      statusCode: 404,
      body: { error: 'Character not found' }
    }).as('characterNotFound')

    cy.getByTestId('character-name-input').type('NonExistent')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    cy.wait('@characterNotFound')
    cy.contains('Search Failed').should('be.visible')
    cy.contains('Character not found. Please check the name and server spelling.').should('be.visible')
  })

  it('should show demo data toast when API returns mock data', () => {
    cy.intercept('POST', '/api/character', {
      statusCode: 200,
      body: {
        character: {
          id: '99999999',
          name: 'Demo User',
          server: 'Cactuar',
          avatar: '/placeholder.svg',
          achievementPoints: 500,
          achievementsCompleted: 50,
          totalAchievements: 2500,
        },
        completedAchievements: [],
        _isMockData: true,
        _error: 'XIVAPI is down. Showing demo data.'
      }
    }).as('mockCharacterSearch')

    cy.getByTestId('character-name-input').type('Demo User')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    cy.wait('@mockCharacterSearch')
    cy.contains('Using Demo Data').should('be.visible')
    cy.contains('XIVAPI is down. Showing demo data.').should('be.visible')
  })

  it('should clear validation errors when user types', () => {
    // Trigger validation error
    cy.getByTestId('search-button').click()
    cy.contains('Character name is required').should('be.visible')
    
    // Start typing - error should clear
    cy.getByTestId('character-name-input').type('Test')
    cy.contains('Character name is required').should('not.exist')
  })

  it('should clear server validation error when user selects server', () => {
    // Trigger validation error
    cy.getByTestId('search-button').click()
    cy.contains('Please select a server').should('be.visible')
    
    // Select server - error should clear
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.contains('Please select a server').should('not.exist')
  })

  it('should show loading state during search', () => {
    cy.intercept('POST', '/api/character', {
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
        completedAchievements: []
      }
    }).as('slowCharacterSearch')

    cy.getByTestId('character-name-input').type('Test Character')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    cy.getByTestId('search-button').should('be.disabled')
    cy.getByTestId('search-button').should('contain', 'Searching...')
    cy.get('.animate-spin').should('be.visible')

    cy.wait('@slowCharacterSearch')
  })
})