describe('API Endpoints', () => {
  describe('/api/character', () => {
    it('should return 400 for missing parameters', () => {
      cy.request({
        method: 'POST',
        url: '/api/character',
        body: {},
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body.error).to.include('required')
      })
    })

    it('should return 400 for invalid server', () => {
      cy.request({
        method: 'POST',
        url: '/api/character',
        body: {
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
            // These are estimated by our API route if not provided by Tomestone.gg
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

      cy.request({
        method: 'POST',
        url: '/api/character',
        body: {
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
        method: 'POST',
        url: '/api/character',
        body: {
          name: 'Any Character',
          server: 'Cactuar'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(200); // Should still return 200 because of mock data fallback
        expect(response.body).to.have.property('character');
        expect(response.body.character).to.have.property('name', 'Any Character');
        expect(response.body).to.have.property('_isMockData', true);
        expect(response.body).to.have.property('_error');
        expect(response.body._error).to.include('Tomestone.gg API unavailable');
      });
    });
  })

  describe('/api/achievements', () => {
    it('should return achievements data', () => {
      cy.request({
        method: 'GET',
        url: '/api/achievements',
        timeout: 30000 // Allow longer timeout for this endpoint
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.be.an('array')
        
        if (response.body.length > 0) {
          const achievement = response.body[0]
          expect(achievement).to.have.property('id')
          expect(achievement).to.have.property('name')
          expect(achievement).to.have.property('description')
          expect(achievement).to.have.property('category')
          expect(achievement).to.have.property('points')
          expect(achievement).to.have.property('isObtainable')
          expect(achievement).to.have.property('icon') // Should have an icon
        }
      })
    })
  })
})