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
          achievement_points: 1000, 
          achievements_completed: 100,
        },
        achievements: [
          { id: 1, date: '2023-01-01T00:00:00Z' },
          { id: 2, date: '2023-01-02T00:00:00Z' }
        ]
      }
    }).as('tomestoneCharacterData');

    // Intercept the local /api/character GET request
    cy.intercept('GET', '/api/character?name=Digs%20Reynar&server=Cactuar', {
      statusCode: 200,
      body: {
        character: {
          id: '12345678',
          name: 'Digs Reynar',
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
        _isRealData: true
      }
    }).as('localCharacterApi');


    cy.getByTestId('character-name-input').type('Digs Reynar')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    cy.wait('@localCharacterApi') // Wait for the local API call
    cy.url().should('include', '/achievements')
    cy.url().should('include', 'name=Digs%20Reynar')
    cy.url().should('include', 'server=Cactuar')
    cy.contains('Character Found!').should('be.visible')
    cy.contains('Successfully loaded data for Digs Reynar on Cactuar.').should('be.visible')
  })

  it('should handle character not found error and show error toast', () => {
    cy.intercept('GET', 'https://tomestone.gg/api/character/search*', {
      statusCode: 200,
      body: { characters: [] }
    }).as('tomestoneNotFound');

    cy.intercept('GET', '/api/character?name=NonExistent&server=Cactuar', {
      statusCode: 404,
      body: { error: 'Character not found. Please check the name and server spelling.' }
    }).as('localCharacterApiNotFound');

    cy.getByTestId('character-name-input').type('NonExistent')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    cy.wait('@localCharacterApiNotFound')
    cy.contains('Search Failed').should('be.visible')
    cy.contains('Character not found. Please check the name and server spelling.').should('be.visible')
  })

  it('should show demo data toast when API returns mock data', () => {
    cy.intercept('GET', 'https://tomestone.gg/api/character/search*', {
      statusCode: 500,
      body: 'Internal Server Error'
    }).as('tomestoneSearchFail');

    cy.intercept('GET', '/api/character?name=Demo%20User&server=Cactuar', {
      statusCode: 200,
      body: {
        character: {
          id: 'mock123',
          name: 'Demo User',
          server: 'Cactuar',
          avatar: '/placeholder.svg',
          achievementPoints: 500,
          achievementsCompleted: 50,
          totalAchievements: 2500,
        },
        completedAchievements: [],
        _isMockData: true,
        _error: 'Tomestone.gg API unavailable: Internal Server Error. Showing demo data.'
      }
    }).as('localCharacterApiMock');

    cy.getByTestId('character-name-input').type('Demo User')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    cy.wait('@localCharacterApiMock')
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
          achievement_points: 1000,
          achievements_completed: 100,
        },
        achievements: []
      }
    }).as('slowTomestoneCharacterData');

    cy.intercept('GET', '/api/character?name=Test%20Character&server=Cactuar', {
      delay: 4000, // Simulate longer local API processing
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
        _isRealData: true
      }
    }).as('slowLocalCharacterApi');

    cy.getByTestId('character-name-input').type('Test Character')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    cy.getByTestId('search-button').should('be.disabled')
    cy.getByTestId('search-button').should('contain', 'Searching...')
    cy.get('.animate-spin').should('be.visible')

    cy.wait('@slowLocalCharacterApi')
  })
})