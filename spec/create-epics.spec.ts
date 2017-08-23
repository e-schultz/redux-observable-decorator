import { Epic, getEpicsMetadata, createEpics } from '../src/epic-decorator';
import { Action } from 'redux';
import { createStore, applyMiddleware } from 'redux';
import 'rxjs/add/operator/mapTo';
import { createEpicMiddleware, ActionsObservable } from 'redux-observable';
interface TestState {
  type: string;
  payload?: any;
}
describe('createEpics', () => {
  it('should create an for a decorated method', () => {
    class Test {
      @Epic()
      epic = (action$: ActionsObservable<Action>) =>
        action$.ofType('TEST_IN').mapTo({ type: 'TEST_OUT' });
    }
    const reducer = (state: any[] = [], action: any) => state.concat(action);
    const epics = new Test();
    const epicMiddleware = createEpics(epics);
    const store = createStore(reducer, applyMiddleware(epicMiddleware));
    const expected = [
      { type: '@@redux/INIT' },
      { type: 'TEST_IN' },
      { type: 'TEST_OUT' }
    ];
    store.dispatch({ type: 'TEST_IN' });
    const actual = store.getState();

    expect(actual).toEqual(expected);
  });

  it('should combine decorated methods into an epic', () => {
    class Test {
      @Epic()
      epicOne = (action$: ActionsObservable<Action>) =>
        action$.ofType('TEST_IN').mapTo({ type: 'TEST_OUT' });
      @Epic()
      epicTwo = (action$: ActionsObservable<Action>) =>
        action$.ofType('TEST_OUT').mapTo({ type: 'TEST_END' });
      @Epic()
      epicThree = (action$: ActionsObservable<Action>) =>
        action$.ofType('TEST_TWO').mapTo({ type: 'TEST_THREE' });
    }
    const reducer = (state: TestState[] = [], action: any) =>
      state.concat(action);
    const epics = new Test();
    const epicMiddleware = createEpics(epics);
    const store = createStore(reducer, applyMiddleware(epicMiddleware));
    const expected = [
      { type: '@@redux/INIT' },
      { type: 'TEST_IN' },
      { type: 'TEST_OUT' },
      { type: 'TEST_END' },
      { type: 'TEST_TWO' },
      { type: 'TEST_THREE' }
    ];
    store.dispatch({ type: 'TEST_IN' });
    store.dispatch({ type: 'TEST_TWO' });
    const actual = store.getState();

    expect(actual).toEqual(expected);
  });

  it('should handle multipul classes', () => {
    class TestOne {
      @Epic()
      a = (action$: ActionsObservable<Action>) =>
        action$.ofType('TEST_A_IN').mapTo({ type: 'TEST_A_OUT' });
      @Epic()
      b = (action$: ActionsObservable<Action>) =>
        action$.ofType('TEST_B_IN').mapTo({ type: 'TEST_B_OUT' });
      @Epic()
      c = (action$: ActionsObservable<Action>) =>
        action$.ofType('TEST_C_IN').mapTo({ type: 'TEST_C_OUT' });
    }
    class TestTwo {
      @Epic()
      d = (action$: ActionsObservable<Action>) =>
        action$.ofType('TEST_D_IN').mapTo({ type: 'TEST_D_OUT' });
      @Epic()
      e = (action$: ActionsObservable<Action>) =>
        action$.ofType('TEST_E_IN').mapTo({ type: 'TEST_E_OUT' });
      @Epic()
      f = (action$: ActionsObservable<Action>) =>
        action$.ofType('TEST_F_IN').mapTo({ type: 'TEST_F_OUT' });
    }

    const reducer = (state: any[] = [], action: any) => state.concat(action);
    const epicOne = new TestOne();
    const epicTwo = new TestTwo();
    const epicMiddleware = createEpics(epicOne, epicTwo);
    const store = createStore(reducer, applyMiddleware(epicMiddleware));
    const expected = [
      { type: '@@redux/INIT' },
      { type: 'TEST_A_IN' },
      { type: 'TEST_A_OUT' },
      { type: 'TEST_B_IN' },
      { type: 'TEST_B_OUT' },
      { type: 'TEST_C_IN' },
      { type: 'TEST_C_OUT' },
      { type: 'TEST_D_IN' },
      { type: 'TEST_D_OUT' },
      { type: 'TEST_E_IN' },
      { type: 'TEST_E_OUT' },
      { type: 'TEST_F_IN' },
      { type: 'TEST_F_OUT' }
    ];

    store.dispatch({ type: 'TEST_A_IN' });
    store.dispatch({ type: 'TEST_B_IN' });
    store.dispatch({ type: 'TEST_C_IN' });
    store.dispatch({ type: 'TEST_D_IN' });
    store.dispatch({ type: 'TEST_E_IN' });
    store.dispatch({ type: 'TEST_F_IN' });

    const actual = store.getState();

    expect(actual).toEqual(expected);
  });

  it('should pass in the options object if one is provided', () => {
    class TestOneDep {
      @Epic()
      a = (action$: ActionsObservable<Action>, store: any, deps: any) =>
        action$
          .ofType('TEST_A_IN')
          .mapTo({ type: 'TEST_A_OUT', payload: deps.foo() });
    }

    class TestTwoDep {
      @Epic()
      a = (action$: ActionsObservable<Action>, store: any, deps: any) =>
        action$
          .ofType('TEST_D_IN')
          .mapTo({ type: 'TEST_D_OUT', payload: deps.foo() });
    }

    const reducer = (state: TestState[] = [], action: any) =>
      state.concat(action);

    const epicOne = new TestOneDep();
    const epicTwo = new TestTwoDep();

    const epicMiddleware = createEpics(epicOne, epicTwo, {
      dependencies: {
        foo: function() {
          return 'bar';
        }
      }
    });

    const store = createStore(reducer, applyMiddleware(epicMiddleware));

    const expected = [
      { type: '@@redux/INIT' },
      { type: 'TEST_A_IN' },
      { type: 'TEST_A_OUT', payload: 'bar' },
      { type: 'TEST_D_IN' },
      { type: 'TEST_D_OUT', payload: 'bar' }
    ];

    store.dispatch({ type: 'TEST_A_IN' });
    store.dispatch({ type: 'TEST_D_IN' });

    const actual = store.getState();

    expect(actual).toEqual(expected);
  });

  it('should not pass in dependencies if no options provided', () => {
    class TestOneNoDep {
      @Epic()
      a = (action$: ActionsObservable<Action>, store: any, deps: any) => {
        console.log(store, deps);
        return action$
          .ofType('TEST_A_IN')
          .mapTo({ type: 'TEST_A_OUT', payload: deps });
      };
    }

    const reducer = (
      state: TestState[] = [],
      action: { type: string; payload?: any }
    ) => state.concat(action);
    const epicOne = new TestOneNoDep();

    const epicMiddleware = createEpics(epicOne);

    const store = createStore(reducer, applyMiddleware(epicMiddleware));

    const expected: TestState[] = [
      { type: '@@redux/INIT' },
      { type: 'TEST_A_IN' },
      { type: 'TEST_A_OUT', payload: undefined }
    ];

    store.dispatch({ type: 'TEST_A_IN' });

    const actual = store.getState();
    expect(actual).toEqual(expected);
  });
});
