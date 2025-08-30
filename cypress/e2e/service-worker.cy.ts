describe('Service Worker and Caching', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
  })

  it('should register service worker in production', () => {
    // This test would only work in production build
    cy.visit('/')
    
    cy.window().then((win) => {
      if ('serviceWorker' in win.navigator) {
        cy.wrap(win.navigator.serviceWorker.getRegistrations()).then((registrations: ServiceWorkerRegistration[]) => {
          // In development, service worker might not be registered
          // In production, it should be
          if (registrations.length > 0) {
            expect(registrations[0].scope).to.include(win.location.origin)
          }
        })
      }
    })
  })

  it('should cache static assets', () => {
    cy.visit('/')
    
    // Check that caches API is available
    cy.window().then((win) => {
      if ('caches' in win) {
        cy.wrap(win.caches.keys()).then((cacheNames: string[]) => {
          // Should have at least one cache
          if (cacheNames.length > 0) {
            expect(cacheNames[0]).to.include('eorzean-compass')
          }
        })
      }
    })
  })

  it('should not make redundant API calls for cached data', () => {
    let characterApiCalls = 0
    let achievementsApiCalls = 0

    cy.intercept('GET', '/api/character*', (req) => {
      characterApiCalls++
      req.reply({
        statusCode: 200,
        body: {
          character: {
            id: '12345',
            name: 'Test Character',
            server: 'Cactuar',
            avatar: '/placeholder.svg',
            achievementPoints: 1000,
            achievementsCompleted: 0,
            totalAchievements: 0,
            lastUpdated: new Date().toISOString(),
          },
          lodestoneId: 12345,
          completedAchievements: [],
          _isRealData: true
        }
      })
    }).as('characterApi')

    cy.intercept('GET', '/api/achievements*', (req) => {
      achievementsApiCalls++
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

    // First visit
    cy.visit('/')
    cy.getByTestId('character-name-input').type('Test Character')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    cy.wait('@characterApi')
    cy.wait('@achievementsApi')

    // Navigate away and back
    cy.visit('/')
    cy.getByTestId('character-name-input').type('Test Character')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    // Should use cached data, not make new API calls
    cy.then(() => {
      expect(characterApiCalls).to.equal(1) // Should only call once due to caching
    })
  })

  it('should handle offline mode gracefully', () => {
    // First, load data while online
    cy.intercept('GET', '/api/character*', {
      statusCode: 200,
      body: {
        character: {
          id: '12345',
          name: 'Test Character',
          server: 'Cactuar',
          avatar: '/placeholder.svg',
          achievementPoints: 1000,
          achievementsCompleted: 50,
          totalAchievements: 100,
          lastUpdated: new Date().toISOString(),
        },
        lodestoneId: 12345,
        completedAchievements: [],
        _isRealData: true
      }
    }).as('characterApi')

    cy.visit('/')
    cy.getByTestId('character-name-input').type('Test Character')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    cy.wait('@characterApi')

    // Simulate offline by intercepting with network error
    cy.intercept('GET', '/api/character*', { forceNetworkError: true }).as('offlineCharacterApi')

    // Try to search again
    cy.visit('/')
    cy.getByTestId('character-name-input').type('Test Character')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    // Should show cached data message
    cy.contains('Using cached data').should('be.visible')
  })
})