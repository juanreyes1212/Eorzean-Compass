describe('UI Updates and Real-time Data', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
  })

  it('should update character profile stats after achievements load', () => {
    // Mock character API with initial zero stats
    cy.intercept('GET', '/api/character*', {
      statusCode: 200,
      body: {
        character: {
          id: '17873508',
          name: 'Battle Voice',
          server: 'Adamantoise',
          avatar: 'https://img2.finalfantasyxiv.com/f/test.jpg',
          achievementPoints: 14905,
          achievementsCompleted: 0, // Initially 0
          totalAchievements: 0, // Initially 0
          lastUpdated: new Date().toISOString(),
        },
        lodestoneId: 17873508,
        completedAchievements: [],
        _isRealData: true
      }
    }).as('characterApi')

    // Mock achievements API with realistic completion data
    cy.intercept('GET', '/api/achievements*', {
      statusCode: 200,
      body: Array.from({ length: 3694 }, (_, i) => ({
        id: i + 1,
        name: `Achievement ${i + 1}`,
        description: `Description for achievement ${i + 1}`,
        category: ['Battle', 'Character', 'Items', 'Crafting & Gathering', 'Quests'][i % 5],
        points: Math.floor(Math.random() * 50) + 5,
        patch: '7.0',
        isObtainable: true,
        isCompleted: i < 1575, // 1575 completed out of 3694
        icon: `https://ffxivcollect.com/images/achievements/00${String(i + 1).padStart(6, '0')}.png`,
        rarity: Math.random() * 100,
        tsrg: {
          time: Math.floor(Math.random() * 10) + 1,
          skill: Math.floor(Math.random() * 10) + 1,
          rng: Math.floor(Math.random() * 10) + 1,
          group: Math.floor(Math.random() * 10) + 1,
          composite: Math.floor(Math.random() * 30) + 10,
          tier: Math.floor(Math.random() * 4) + 1
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

    // Check that character stats are updated after achievements load
    cy.contains('1575').should('be.visible') // Completed count
    cy.contains('43%').should('be.visible') // Completion rate (1575/3694 ≈ 43%)
    cy.contains('3694 obtainable achievements available').should('be.visible')

    // Check that the tab shows correct counts
    cy.contains('Your Achievements (1575 unlocked out of 3694)').should('be.visible')
  })

  it('should show loading progress during achievements fetch', () => {
    cy.intercept('GET', '/api/achievements*', {
      delay: 3000,
      statusCode: 200,
      body: []
    }).as('slowAchievements')

    cy.visit('/achievements?name=Test%20Character&server=Cactuar')
    
    // Should show loading state with progress
    cy.contains('Loading achievements and generating recommendations').should('be.visible')
    
    cy.wait('@slowAchievements')
  })

  it('should refresh data when refresh button is clicked', () => {
    let apiCallCount = 0

    cy.intercept('GET', '/api/achievements*', (req) => {
      apiCallCount++
      req.reply({
        statusCode: 200,
        body: Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          name: `Achievement ${i + 1} (Call ${apiCallCount})`,
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

    // Click refresh button
    cy.contains('Refresh Data').click()
    cy.wait('@achievementsApi')

    // Should have made 2 API calls
    cy.then(() => {
      expect(apiCallCount).to.equal(2)
    })

    // Should show updated data
    cy.contains('Achievement 1 (Call 2)').should('be.visible')
  })

  it('should handle filter changes without additional API calls', () => {
    let apiCallCount = 0

    cy.intercept('GET', '/api/achievements*', (req) => {
      apiCallCount++
      req.reply({
        statusCode: 200,
        body: Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          name: `Achievement ${i + 1}`,
          description: `Description ${i + 1}`,
          category: i % 2 === 0 ? 'Battle' : 'Character',
          points: 10,
          patch: '7.0',
          isObtainable: true,
          isCompleted: i < 25,
          icon: null,
          rarity: 50,
          tsrg: {
            time: (i % 10) + 1,
            skill: (i % 10) + 1,
            rng: (i % 10) + 1,
            group: (i % 10) + 1,
            composite: 20,
            tier: Math.floor(i / 25) + 1
          }
        }))
      })
    }).as('achievementsApi')

    cy.visit('/achievements?name=Test%20Character&server=Cactuar')
    cy.wait('@achievementsApi')

    // Change filters - should not trigger new API calls
    cy.get('[data-testid="tier-4-badge"]').click()
    cy.get('[data-testid="hide-completed-switch"]').click()
    cy.get('[data-testid="time-slider"]').click()

    // Wait and verify no additional API calls
    cy.wait(1000)
    cy.then(() => {
      expect(apiCallCount).to.equal(1) // Should still be only 1 call
    })

    // But should update the filtered results count
    cy.contains('Filtered Results').should('be.visible')
  })

  it('should show toast notifications for data updates', () => {
    cy.intercept('GET', '/api/achievements*', {
      statusCode: 200,
      body: Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `Achievement ${i + 1}`,
        description: `Description ${i + 1}`,
        category: 'Battle',
        points: 10,
        patch: '7.0',
        isObtainable: true,
        isCompleted: i < 20,
        icon: null,
        rarity: 50,
        tsrg: { time: 5, skill: 5, rng: 5, group: 5, composite: 20, tier: 2 }
      }))
    }).as('achievementsApi')

    cy.visit('/achievements?name=Test%20Character&server=Cactuar')
    cy.wait('@achievementsApi')

    // Should show success toast
    cy.contains('Achievements Loaded').should('be.visible')
    cy.contains('Successfully loaded 50 achievements with 20 completed').should('be.visible')
  })

  it('should handle tab switching without data reload', () => {
    let apiCallCount = 0

    cy.intercept('GET', '/api/achievements*', (req) => {
      apiCallCount++
      req.reply({
        statusCode: 200,
        body: Array.from({ length: 20 }, (_, i) => ({
          id: i + 1,
          name: `Achievement ${i + 1}`,
          description: `Description ${i + 1}`,
          category: 'Battle',
          points: 10,
          patch: '7.0',
          isObtainable: true,
          isCompleted: i < 5,
          icon: null,
          rarity: 50,
          tsrg: { time: 5, skill: 5, rng: 5, group: 5, composite: 20, tier: 2 }
        }))
      })
    }).as('achievementsApi')

    cy.visit('/achievements?name=Test%20Character&server=Cactuar')
    cy.wait('@achievementsApi')

    // Switch between tabs
    cy.contains('Your Achievements').click()
    cy.contains('Recommendations & Projects').click()
    cy.contains('Your Achievements').click()

    // Should not make additional API calls
    cy.then(() => {
      expect(apiCallCount).to.equal(1)
    })
  })
})