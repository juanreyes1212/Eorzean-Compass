describe('API Endpoints', () => {
  describe('/api/character', () => {
    it('should return 400 for missing parameters', () => {
      cy.request({
        method: 'GET', // Changed to GET
        url: '/api/character',
        qs: {}, // Query parameters
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body.error).to.include('required')
      })
    })

    it('should return 400 for invalid server', () => {
      cy.request({
        method: 'GET', // Changed to GET
        url: '/api/character',
        qs: { // Query parameters
          name: 'Test Character',
          server: 'InvalidServer'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body.error).to.include('Invalid server')
      })
    })

    it('should handle valid character search request and return real data', () => {
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

      cy.request({
        method: 'GET', // Changed to GET
        url: '/api/character',
        qs: { // Query parameters
          name: 'Digs Reynar',
          server: 'Cactuar'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('character');
        expect(response.body.character).to.have.property('name', 'Digs Reynar');
        expect(response.body).to.have.property('_isRealData', true);
        expect(response.body).to.have.property('completedAchievements').and.to.be.an('array');
      });
    });

    it('should return mock data when Tomestone.gg API fails', () => {
      // Intercept Tomestone.gg search to simulate failure
      cy.intercept('GET', 'https://tomestone.gg/api/character/search*', {
        statusCode: 500,
        body: 'Internal Server Error'
      }).as('tomestoneSearchFail');

      // Intercept Tomestone.gg character data fetch to simulate failure
      cy.intercept('GET', 'https://tomestone.gg/api/character/*', {
        statusCode: 500,
        body: 'Internal Server Error'
      }).as('tomestoneCharacterFail');

      cy.request({
        method: 'GET', // Changed to GET
        url: '/api/character',
        qs: { // Query parameters
          name: 'Any Character',
          server: 'Cactuar'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('character');
        expect(response.body.character).to.have.property('name', 'Any Character');
        expect(response.body).to.have.property('_isMockData', true);
        expect(response.body).to.have.property('_error');
        expect(response.body._error).to.include('Tomestone.gg API unavailable');
      });
    });
  })

  describe('/api/achievements', () => {
    it('should return achievements data from Tomestone.gg', () => {
      // Mock Tomestone.gg achievements API
      cy.intercept('GET', 'https://tomestone.gg/api/achievements*', {
        statusCode: 200,
        body: {
          count: 2,
          results: [
            {
              id: 1,
              name: "Mock Achievement 1",
              description: "Description 1",
              points: 10,
              category: "Battle",
              patch: "6.0",
              icon: "https://ffxivcollect.com/images/achievements/061000/061301.png",
              rarity: 50.0
            },
            {
              id: 2,
              name: "Mock Achievement 2",
              description: "Description 2",
              points: 20,
              category: "Quests",
              patch: "6.1",
              icon: "https://ffxivcollect.com/images/achievements/061000/061302.png",
              rarity: 25.0
            }
          ]
        }
      }).as('tomestoneAchievements');

      cy.request({
        method: 'GET',
        url: '/api/achievements',
        timeout: 30000
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.be.an('array')
        expect(response.body.length).to.be.greaterThan(0)
        
        const achievement = response.body[0]
        expect(achievement).to.have.property('id')
        expect(achievement).to.have.property('name')
        expect(achievement).to.have.property('description')
        expect(achievement).to.have.property('category')
        expect(achievement).to.have.property('points')
        expect(achievement).to.have.property('isObtainable').to.be.a('boolean') // Inferred
        expect(achievement).to.have.property('icon')
        expect(achievement).to.have.property('rarity')
        expect(achievement).to.have.property('tsrg') // Added by our API route
      })
    })

    it('should return mock data when Tomestone.gg achievements API fails', () => {
      cy.intercept('GET', 'https://tomestone.gg/api/achievements*', {
        statusCode: 500,
        body: 'Internal Server Error'
      }).as('tomestoneAchievementsFail');

      cy.request({
        method: 'GET',
        url: '/api/achievements',
        timeout: 30000
      }).then((response) => {
        expect(response.status).to.eq(200); // Still 200 due to mock fallback
        expect(response.body).to.be.an('array');
        expect(response.body.length).to.be.greaterThan(0); // Should contain mock data
        expect(response.body[0]).to.have.property('name').and.include('Achievement'); // Check for mock data pattern
      });
    });
  })
})