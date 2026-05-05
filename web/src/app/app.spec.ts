import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  // Bun doesn't fully support Angular component compilation with external templates.
  // Use `ng test` for full Angular component testing with CLI test runner.

  it.skip('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it.skip('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello, hyle-registry');
  });
});
