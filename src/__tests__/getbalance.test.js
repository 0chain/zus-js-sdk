import { getBalance, getSomething } from "../index";
import mockAxios from 'jest-mock-axios';

afterEach(() => {
  // cleaning up the mess left behind the previous test
  mockAxios.reset();
});

test("getBalance", async() => {
  let catchFn = jest.fn(),
  thenFn = jest.fn();
  
  getBalance("3684fdc729db856292a7ae7936a6fb4ca8b6a131b48df66e6dd7e9edf04be355").then(thenFn)
  .catch(catchFn);

  // mockAxios.get.mockResolvedValueOnce({balance: 1});

  // const result = await getBalance("3684fdc729db856292a7ae7936a6fb4ca8b6a131b48df66e6dd7e9edf04be355");

  expect(mockAxios.get).toHaveBeenCalledWith('https://beta.0chain.net/sharder01/v1/client/get/balance');

  // let responseObj = { data: 'server says hello!' };
  // mockAxios.mockResponse(responseObj);

  // since `post` method is a spy, we can check if the server request was correct
  // a) the correct method was used (post)
  // b) went to the correct web service URL ('/web-service-url/')
  // c) if the payload was correct ('client is saying hello!')
  //expect(mockAxios.get).toHaveBeenCalledWith('https://beta.0chain.net/sharder01/v1/client/get/balance');
  // expect(mockAxios.get).toHaveBeenCalled();


  // simulating a server response
  // let responseObj = { data: 'server says hello!' };
  // mockAxios.mockResponse(responseObj);

  // checking the `then` spy has been called and if the
  // response from the server was converted to upper case
  // expect(thenFn).toHaveBeenCalledWith('SERVER SAYS HELLO!');

  // catch should not have been called
  // expect(catchFn).not.toHaveBeenCalled();
});

it('UppercaseProxy should get data from the server and convert it to UPPERCASE', () => {

  let catchFn = jest.fn(),
      thenFn = jest.fn();

  // using the component, which should make a server response
  let clientMessage = 'client is saying hello!';

  getSomething(clientMessage)
      .then(thenFn)
      .catch(catchFn);

  // since `post` method is a spy, we can check if the server request was correct
  // a) the correct method was used (post)
  // b) went to the correct web service URL ('/web-service-url/')
  // c) if the payload was correct ('client is saying hello!')
  expect(mockAxios.post).toHaveBeenCalledWith('https://beta.0chain.net/sharder01/v1/client/get/balance', {data: clientMessage });

  // simulating a server response
  let responseObj = { data: 'server says hello!' };
  mockAxios.mockResponse(responseObj);

  // checking the `then` spy has been called and if the
  // response from the server was converted to upper case
  expect(thenFn).toHaveBeenCalledWith('SERVER SAYS HELLO!');

  // catch should not have been called
  expect(catchFn).not.toHaveBeenCalled();
});
