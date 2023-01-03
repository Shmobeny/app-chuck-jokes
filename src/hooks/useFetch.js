import { isRef, unref } from "vue";
import useRandom from "./useRandom";

async function useFetch(url, delay = false) {
  let data = null;
  let error = null;

  if ( isRef(url) ) url = unref(url);
  
  if (delay) {
    console.log(url + " is start fetching with delay in " + delay + " ms");
    await new Promise((res) => setTimeout(res, delay));
  } else {
    console.log(url + " is start fetching without delay");
  }

  await fetch(url)
    .then(res => res.json())
    .then(json => {
      if (json.error) {
        json.error === "Bad Request" ? throwCustomError(QueryLengthError, "Search query must be in a range from 3 to 120 symbols") : 
                                       throwCustomError(FetchError, "Error during fetching");
      } else {
        json.result && json.total > 0 ? data = json.result[useRandom(0, json.total - 1)] :
        json.result && json.total === 0 ? throwCustomError(SearchError, "Joke not found") : data = json;
      }
    })
    .catch(err => {
      window.navigator.onLine ? error = err : error = new ConnetionError("Internet connection lost");
    });

  return { data, error }
}

function throwCustomError(type, msg) {
  throw new type(msg);
}

class FetchError extends Error {
  constructor(message) {
    super(message);
    this.type = "FetchError";
  }
}

class QueryLengthError extends Error {
  constructor(message) {
    super(message);
    this.type = "QueryLengthError";
  }
}

class SearchError extends Error {
  constructor(message) {
    super(message);
    this.type = "SearchError";
  }
}

class ConnetionError extends Error {
  constructor(message) {
    super(message);
    this.type = "ConnetionError";
  }
}

export default useFetch;