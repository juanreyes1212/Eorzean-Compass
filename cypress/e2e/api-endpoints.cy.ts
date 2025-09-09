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