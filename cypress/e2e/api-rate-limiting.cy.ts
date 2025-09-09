describe('API Rate Limiting and Performance', () => {
  it('should handle rate limiting gracefully', () => {
    // Mock rate limit response
    cy.intercept('GET', '/api/character*', {
      statusCode: 429,
      body: { error: 'Too many requests. Please wait before trying again.' }
    }).as('rateLimitedApi')

    cy.visit('/')
    cy.getByTestId('character-name-input').type('Test Character')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    cy.wait('@rateLimitedApi')
    
    // Should show rate limit error
    cy.contains('Too many requests').should('be.visible')
    cy.contains('Please wait before trying again').should('be.visible')
  })

  it('should not make concurrent API calls for same character', () => {
    let apiCallCount = 0
    
    cy.intercept('GET', '/api/character*', (req) => {
      apiCallCount++
      // Add delay to simulate slow API
      req.reply({
        delay: 2000,
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
    }).as('slowCharacterApi')

    cy.visit('/')
    
    // Rapidly click search multiple times
    cy.getByTestId('character-name-input').type('Test Character')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    
    cy.getByTestId('search-button').click()
    cy.getByTestId('search-button').click()
    cy.getByTestId('search-button').click()

    cy.wait('@slowCharacterApi')

    // Should only make one API call despite multiple clicks
    cy.then(() => {
      expect(apiCallCount).to.equal(1)
    })
  })

  it('should show proper loading indicators during API calls', () => {
    cy.intercept('GET', '/api/character*', {
      delay: 1000,
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
    }).as('characterApi')

    cy.intercept('GET', '/api/achievements*', {
      delay: 2000,
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
    }).as('achievementsApi')

    cy.visit('/')
    cy.getByTestId('character-name-input').type('Test Character')
    cy.getByTestId('server-select').click()
    cy.getByTestId('server-option-Cactuar').click()
    cy.getByTestId('search-button').click()

    // Should show character loading
    cy.contains('Searching...').should('be.visible')
    cy.get('.animate-spin').should('be.visible')

    cy.wait('@characterApi')
    cy.wait('@achievementsApi')

    // Should show achievements loading
    cy.contains('Loading achievements and generating recommendations').should('be.visible')
  })

  it('should prevent duplicate achievement fetches', () => {
    let achievementApiCalls = 0

    cy.intercept('GET', '/api/achievements*', (req) => {
      achievementApiCalls++
      req.reply({
        statusCode: 200,
        body: Array.from({ length: 5 }, (_, i) => ({
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

    // Trigger various UI interactions that shouldn't cause new API calls
    cy.get('[data-testid="tier-1-badge"]').click()
    cy.get('[data-testid="hide-completed-switch"]').click()
    cy.contains('Recommendations & Projects').click()
    cy.contains('Your Achievements').click()

    // Should still only have made one API call
    cy.then(() => {
      expect(achievementApiCalls).to.equal(1)
    })
  })
})