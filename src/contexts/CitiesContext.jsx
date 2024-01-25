import {
  createContext,
  useEffect,
  useContext,
  useReducer,
  useCallback,
} from 'react';
import { v4 as uuidv4 } from 'uuid';

const CitiesContext = createContext();

function reducer(state, action) {
  switch (action.type) {
    case 'loading':
      return { ...state, isLoading: true };
    case 'cities/loaded':
      return {
        ...state,
        isLoading: false,
        cities: action.payload,
      };
    case 'city/loaded':
      return {
        ...state,
        isLoading: false,
        currentCity: action.payload,
      };
    case 'city/created':
      localStorage.setItem(
        'cities',
        JSON.stringify([...state.cities, action.payload])
        );
      return {
        ...state,
        isLoading: false,
        cities: [...state.cities, action.payload],
        currentCity: action.payload,
      };
    case 'city/deleted':
      localStorage.setItem(
        'cities',
        JSON.stringify(
          state.cities.filter((city) => city.id !== action.payload)
        )
      );
      return {
        ...state,
        isLoading: false,
        cities: state.cities.filter((city) => city.id !== action.payload),
        currentCity: {},
      };

    case 'rejected':
      return { ...state, isLoading: false, error: action.payload };
    default:
      throw new Error('Unknown action type');
  }
}

const initialState = {
  cities: [],
  isLoading: false,
  currentCity: {},
  error: '',
};

function CitiesProvider({ children }) {
  const [{ cities, isLoading, currentCity, error }, dispatch] = useReducer(
    reducer,
    initialState
  );

  useEffect(function () {
    async function fetchCities() {
      dispatch({ type: 'loading' });
      try {
        const res = localStorage.getItem('cities') || localStorage.setItem('cities', []);
        dispatch({ type: 'cities/loaded', payload: JSON.parse(res) });
      } catch (err) {
        dispatch({
          type: 'rejected',
          payload: `There was an error loading cities data`,
        });
      }
    }
    fetchCities();
  }, []);

  const getCity = useCallback(
    async function getCity(id) {
      if (id === currentCity.id) return;

      dispatch({ type: 'loading' });
      try {
        const res = localStorage.getItem('cities');
        const data = res.id === id
        dispatch({ type: 'city/loaded', payload: data });
      } catch (err) {
        dispatch({
          type: 'rejected',
          payload: `There was an error loading city data`,
        });
      }
    },
    [currentCity.id]
  );

  async function addCity(newCity) {
    dispatch({ type: 'loading' });
    const id = uuidv4();
    try {
      const toAdd = { ...newCity, id };
      dispatch({ type: 'city/created', payload: toAdd });
    } catch (err) {
      dispatch({
        type: 'rejected',
        payload: `There was an error creating city data`,
      });
    }
  }

  async function remCity(id) {
    dispatch({ type: 'loading' });
    try {
      dispatch({ type: 'city/deleted', payload: id });
    } catch (err) {
      dispatch({
        type: 'rejected',
        payload: `There was an error deleting city data`,
      });
    }
  }

  return (
    <CitiesContext.Provider
      value={{
        cities,
        isLoading,
        error,
        currentCity,
        getCity,
        addCity,
        remCity,
      }}
    >
      {children}
    </CitiesContext.Provider>
  );
}

function useCities() {
  const context = useContext(CitiesContext);
  if (context === undefined) throw new Error('CitiesContext used out of scope');
  return context;
}

export { CitiesProvider, useCities };
