describe('Achievements Loading and Caching', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage()
    
    // Mock character API with real-looking data
    cy.intercept('GET', '/api/character*', {
      statusCode: 200,
      body: {
        character: {
          id: '17873508',
          name: 'Battle Voice',
          server: 'Adamantoise',
          avatar: 'https://img2.finalfantasyxiv.com/f/test.jpg',
          achievementPoints: 14905,
          achievementsCompleted: 0,
          totalAchievements: 0,
          lastUpdated: new Date().toISOString(),
        },
        lodestoneId: 17873508,
        completedAchievements: [],
        _isRealData: true,
        _isMockData: false
      }
    }).as('characterApi')
  })

  it('should load achievements with proper completion status', () => {
    // Mock achievements API with realistic data
    cy.intercept('GET', '/api/achievements*', {
      statusCode: 200,
      body: Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `Achievement ${i + 1}`,
        description: `Description for achievement ${i + 1}`,
        category: i % 2 === 0 ? 'Battle' : 'Character',
        points: Math.floor(Math.random() * 50) + 5,
        patch: '7.0',
        isObtainable: true,
        isCompleted: i < 25, // First 25 are completed
        icon: `https://ffxivcollect.com/images/achievements/00${String(i + 1).padStart(4, '0')}.png`,
        rarity: Math.random() * 100,
        tsrg: {
          time: Math.floor(Math.random() * 10) + 1,
          skill: Math.floor(Math.random() * 10) + 1,
          rng: Math.floor(Math.random() * 10) + 1,
          group: Math.floor(Math.random() * 10) + 1,
          composite: 20,
          tier: 2
        }
      }))
    }).as('achievementsApi')

    cy.visit('/')
    cy.getByTestId('character-name-input').type('Battle Voice')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Adamantoise').click()
    cy.getByTestId('search-button').click()

    cy.wait('@characterApi')
    cy.wait('@achievementsApi')

    // Check that achievements loaded successfully
    cy.contains('Achievements Loaded').should('be.visible')
    cy.contains('Successfully loaded 100 achievements with 25 completed').should('be.visible')

    // Check that completion rate is calculated correctly
    cy.contains('25%').should('be.visible') // 25/100 = 25%

    // Check that achievements table shows data
    cy.get('[data-testid="achievements-table-body"] tr').should('have.length.greaterThan', 0)
    
    // Check that some achievements show as completed
    cy.contains('Completed').should('be.visible')
  })

  it('should cache achievements data properly', () => {
    cy.intercept('GET', '/api/achievements*', {
      statusCode: 200,
      body: Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `Test Achievement ${i + 1}`,
        description: `Test description ${i + 1}`,
        category: 'Battle',
        points: 10,
        patch: '7.0',
        isObtainable: true,
        isCompleted: i < 10,
        icon: null,
        rarity: 50,
        tsrg: { time: 5, skill: 5, rng: 5, group: 5, composite: 20, tier: 2 }
      }))
    }).as('achievementsApi')

    cy.visit('/achievements?name=Test%20Character&server=Cactuar')
    cy.wait('@achievementsApi')

    // Check that data is stored in localStorage
    cy.window().its('localStorage').invoke('getItem', 'eorzean_compass_characters')
      .should('not.be.null')
      .then((stored: unknown) => {
        const data = JSON.parse(stored as string);
        expect(Object.keys(data)).to.have.length.greaterThan(0)
      })
  })

  it('should handle FFXIVCollect API failures gracefully', () => {
    // Mock achievements API failure
    cy.intercept('GET', '/api/achievements*', {
      statusCode: 500,
      body: { error: 'FFXIVCollect API unavailable' }
    }).as('achievementsApiError')

    cy.visit('/achievements?name=Test%20Character&server=Cactuar')
    cy.wait('@achievementsApiError')

    // Should show error state
    cy.contains('Error Loading Achievements').should('be.visible')
    cy.contains('Failed to load achievement data').should('be.visible')
  })

  it('should not make excessive API calls', () => {
    let apiCallCount = 0
    
    cy.intercept('GET', '/api/achievements*', (req) => {
      apiCallCount++
      req.reply({
        statusCode: 200,
        body: Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          name: `Achievement ${i + 1}`,
          description: `Description ${i + 1}`,
          category: 'Battle',
          points: 10,
          patch: '7.0',
          isObtainable: true,
          isCompleted: false,
          icon: null,
          rarity: 50,
          tsrg: { time: 5, skill: 5, rng: 5, group: 5, composite: 20, tier: 2 }
        }))
      })
    }).as('achievementsApi')

    cy.visit('/achievements?name=Test%20Character&server=Cactuar')
    cy.wait('@achievementsApi')

    // Wait a bit and check that no additional calls are made
    cy.wait(2000)
    cy.then(() => {
      expect(apiCallCount).to.equal(1) // Should only make one call
    })
  })

  it('should update character stats after achievements load', () => {
    cy.intercept('GET', '/api/achievements*', {
      statusCode: 200,
      body: Array.from({ length: 200 }, (_, i) => ({
        id: i + 1,
        name: `Achievement ${i + 1}`,
        description: `Description ${i + 1}`,
        category: 'Battle',
        points: 10,
        patch: '7.0',
        isObtainable: true,
        isCompleted: i < 75, // 75 completed out of 200
        icon: null,
        rarity: 50,
        tsrg: { time: 5, skill: 5, rng: 5, group: 5, composite: 20, tier: 2 }
      }))
    }).as('achievementsApi')

    cy.visit('/achievements?name=Test%20Character&server=Cactuar')
    cy.wait('@achievementsApi')

    // Check that character stats are updated
    cy.contains('75').should('be.visible') // Completed count
    cy.contains('37%').should('be.visible') // Completion rate (75/200)
    cy.contains('200 obtainable achievements available').should('be.visible')
  })

  it('should show proper loading states during fetch', () => {
    // Add delay to see loading states
    cy.intercept('GET', '/api/achievements*', {
      delay: 2000,
      statusCode: 200,
      body: []
    }).as('slowAchievements')

    cy.visit('/achievements?name=Test%20Character&server=Cactuar')
    
    // Should show loading state
    cy.contains('Loading achievements and generating recommendations').should('be.visible')
    
    cy.wait('@slowAchievements')
    
    // Loading state should disappear
    cy.contains('Loading achievements and generating recommendations').should('not.exist')
  })
})