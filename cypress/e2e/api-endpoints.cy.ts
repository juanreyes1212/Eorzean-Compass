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

    it('should handle valid character search request', () => {
      // This test would need to be mocked or use a test character
      // For now, we'll just test the request structure
      cy.request({
        method: 'POST',
        url: '/api/character',
        body: {
          name: 'Test Character',
          server: 'Cactuar'
        },
        failOnStatusCode: false
      }).then((response) => {
        // Should either succeed or fail gracefully
        expect([200, 404, 503]).to.include(response.status)
      })
    })

    it('should return mock data when XIVAPI fails', () => {
      // Intercept XIVAPI search to simulate failure
      cy.intercept('GET', 'https://xivapi.com/character/search*', {
        statusCode: 500,
        body: 'Internal Server Error'
      }).as('xivapiSearchFail');

      // Intercept XIVAPI character data fetch to simulate failure
      cy.intercept('GET', 'https://xivapi.com/character/*', {
        statusCode: 500,
        body: 'Internal Server Error'
      }).as('xivapiCharacterFail');

      cy.request({
        method: 'POST',
        url: '/api/character',
        body: {
          name: 'Any Character', // Name doesn't matter as API will fail
          server: 'Cactuar'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(200); // Should still return 200 because of mock data fallback
        expect(response.body).to.have.property('character');
        expect(response.body.character).to.have.property('name', 'Any Character');
        expect(response.body).to.have.property('_isMockData', true);
        expect(response.body).to.have.property('_error');
        expect(response.body._error).to.include('XIVAPI unavailable');
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
        }
      })
    })
  })
})