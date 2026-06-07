import { HttpMethod } from '@glacier/http';

import { RouteCollision, RouteNotFound, Router } from '../src';

describe('@glacier/router', () => {
  test('Scenario 1: Route a simple route', () => {
    const router = new Router();
    router.addRoute({ method: HttpMethod.GET, path: '/users', value: '{{VALUE}}' });
    const route = router.getRoute({ method: HttpMethod.GET, path: '/users' });
    expect(route.value).toBe('{{VALUE}}');
  });

  test('Scenario 2: Route a route with a wildcard segment', () => {
    const router = new Router();
    router.addRoute({ method: HttpMethod.GET, path: '/users/:userId', value: '{{VALUE}}' });
    const route = router.getRoute({ method: HttpMethod.GET, path: '/users/1' });
    expect(route.value).toBe('{{VALUE}}');
    expect(route.variables).toEqual({ userId: '1' });
  });

  test('Scenario 3: Route a route with multiple wildcard segments', () => {
    const router = new Router();
    router.addRoute({
      method: HttpMethod.GET,
      path: '/users/:userId/houses/:houseId',
      value: '{{VALUE}}'
    });
    const route = router.getRoute({ method: HttpMethod.GET, path: '/users/1/houses/2' });
    expect(route.value).toBe('{{VALUE}}');
    expect(route.variables).toEqual({ userId: '1', houseId: '2' });
  });

  test('Scenario 4: Throw an error if no route was registered for request method', () => {
    const router = new Router();
    router.addRoute({ method: HttpMethod.GET, path: '/users/:userId', value: '{{VALUE}}' });
    expect(() => {
      router.getRoute({ method: HttpMethod.POST, path: '/users/1' });
    }).toThrow(RouteNotFound);
  });

  test('Scenario 5: Throw an error if no route was registered for request path', () => {
    const router = new Router();
    router.addRoute({ method: HttpMethod.GET, path: '/users/:userId', value: '{{VALUE}}' });
    expect(() => {
      router.getRoute({ method: HttpMethod.GET, path: '/user' });
    }).toThrow(RouteNotFound);
  });

  test('Scenario 6: Throw an error if path matches only partially', () => {
    const router = new Router();
    router.addRoute({ method: HttpMethod.GET, path: '/users/a/b', value: '{{VALUE}}' });
    expect(() => {
      router.getRoute({ method: HttpMethod.GET, path: '/users/a' });
    }).toThrow(RouteNotFound);
  });

  test('Scenario 7: Throw an error if two routes matches the same path', () => {
    const router = new Router();

    expect(() => {
      router.addRoute({ method: HttpMethod.GET, path: '/users/a/b', value: '{{VALUE}}' });
      router.addRoute({ method: HttpMethod.GET, path: '/users/a/b', value: '{{VALUE}}' });
    }).toThrow(RouteCollision);
  });
});
