describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/auth');
  });

  it('should show login form by default', () => {
    cy.get('h2').should('contain', 'Sign in to your account');
    cy.get('input[type="email"]').should('exist');
    cy.get('input[type="password"]').should('exist');
  });

  it('should toggle between sign in and sign up', () => {
    cy.contains("Don't have an account? Sign up").click();
    cy.get('h2').should('contain', 'Create your account');
    cy.contains('Already have an account? Sign in').click();
    cy.get('h2').should('contain', 'Sign in to your account');
  });

  it('should validate form inputs', () => {
    cy.get('button[type="submit"]').click();
    cy.get('input[type="email"]:invalid').should('exist');
    cy.get('input[type="password"]:invalid').should('exist');
  });
});