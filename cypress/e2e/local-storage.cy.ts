describe('Local Storage Operations', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage()
  })

  it('should cache character data in localStorage', () => {
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
        completedAchievements: [{ id: 1 }, { id: 2 }],
        _isMockData: false
      }
    }).as('characterApi')

    cy.visit('/')
    cy.getByTestId('character-name-input').type('Test Character')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    cy.wait('@characterApi')

    // Check that character data is stored
    cy.window().its('localStorage').invoke('getItem', 'eorzean_compass_characters')
      .should('not.be.null')
      .then((stored) => {
        const characters = JSON.parse(stored)
        expect(characters).to.have.property('test character_cactuar')
        expect(characters['test character_cactuar']).to.have.property('name', 'Test Character')
      })
  })

  it('should cache achievements data', () => {
    cy.intercept('GET', '/api/achievements', {
      fixture: 'achievements-tsrg.json'
    }).as('achievementsApi')

    cy.visit('/achievements?name=Test&server=Cactuar')
    cy.wait('@achievementsApi')

    // Check that achievements are cached
    cy.window().its('localStorage').invoke('getItem', 'eorzean_compass_achievements')
      .should('not.be.null')
      .then((stored) => {
        const cached = JSON.parse(stored)
        expect(cached).to.have.property('data')
        expect(cached).to.have.property('timestamp')
        expect(cached.data).to.be.an('array')
      })
  })

  it('should persist user preferences', () => {
    cy.visit('/achievements?name=Test&server=Cactuar')

    // Change preferences
    cy.get('[data-testid="hide-completed-switch"]').click()
    cy.get('[data-testid="tier-4-badge"]').click()

    // Check localStorage
    cy.window().its('localStorage').invoke('getItem', 'eorzean_compass_preferences')
      .should('not.be.null')
      .then((stored) => {
        const prefs = JSON.parse(stored)
        expect(prefs).to.have.property('hideCompleted', true)
        expect(prefs.selectedTiers).to.not.include(4)
      })
  })

  it('should track recent searches', () => {
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

    // Check recent searches
    cy.window().its('localStorage').invoke('getItem', 'eorzean_compass_recent_searches')
      .should('not.be.null')
      .then((stored) => {
        const searches = JSON.parse(stored)
        expect(searches).to.be.an('array')
        expect(searches[0]).to.have.property('name', 'Test Character')
        expect(searches[0]).to.have.property('server', 'Cactuar')
      })
  })

  it('should handle cache expiration', () => {
    // Manually set expired cache
    const expiredData = {
      data: [{ id: 1, name: 'Old Achievement' }],
      timestamp: Date.now() - (2 * 60 * 60 * 1000) // 2 hours ago
    }
    
    cy.window().then((win) => {
      win.localStorage.setItem('eorzean_compass_achievements', JSON.stringify(expiredData))
    })

    cy.intercept('GET', '/api/achievements', {
      fixture: 'achievements-tsrg.json'
    }).as('freshAchievements')

    cy.visit('/achievements?name=Test&server=Cactuar')

    // Should fetch fresh data due to expired cache
    cy.wait('@freshAchievements')
  })

  it('should limit stored characters to prevent storage overflow', () => {
    // Add multiple characters to test limit
    const characters = {}
    for (let i = 1; i <= 12; i++) {
      characters[`character${i}_cactuar`] = {
        id: `${i}`,
        name: `Character${i}`,
        server: 'Cactuar',
        avatar: '/placeholder.svg',
        achievementPoints: 100,
        achievementsCompleted: 10,
        totalAchievements: 2500,
        completedAchievements: [],
        lastUpdated: new Date(Date.now() - i * 1000).toISOString()
      }
    }

    cy.window().then((win) => {
      win.localStorage.setItem('eorzean_compass_characters', JSON.stringify(characters))
    })

    // Add one more character
    cy.intercept('GET', '/api/character*', {
      statusCode: 200,
      body: {
        character: {
          id: '99999999',
          name: 'New Character',
          server: 'Cactuar',
          avatar: '/placeholder.svg',
          achievementPoints: 1000,
          achievementsCompleted: 100,
          totalAchievements: 2500,
        },
        completedAchievements: [],
        _isMockData: false
      }
    }).as('newCharacterApi')

    cy.visit('/')
    cy.getByTestId('character-name-input').type('New Character')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    cy.wait('@newCharacterApi')

    // Should limit to 10 characters
    cy.window().its('localStorage').invoke('getItem', 'eorzean_compass_characters')
      .then((stored) => {
        const characters = JSON.parse(stored)
        expect(Object.keys(characters)).to.have.length.at.most(10)
        expect(characters).to.have.property('new character_cactuar')
      })
  })
})