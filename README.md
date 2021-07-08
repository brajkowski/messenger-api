# Messenger API

## Overview

### APIs

I broke this service into two separate APIs -- there is a Websocket API that allows clients to send and receive messages, and a REST API that is responsible for providing a list of recent messages based on the high level requirements.
The idea for having the Websocket API was to be able to have low-latency messaging capabilities for users that are actively on the system and to be able to push incoming messages directly to recipients without having to perform long-polling on a REST API.
Since Websockets are a little more involved to work with, I thought it would be better to provide the list of recent messages through the REST API since this data is unlikely to be needed to be streamed to clients.

### Persistence

I added `sqlite3` in order to have some lightweight data persistence between runs as well as leverage some querying capability. This will end up generating a `messages.sqlite3` file at the root of this repository.

### Documentation Generation

The Websocket API is documented with [AsyncAPI](https://www.asyncapi.com/) and the REST API is documented with [OpenAPI](https://swagger.io/specification/). During the build, the `/docs/ws.yml` and the `/docs/rest.yml` files are transformed into html pages and served by the express server.

## Building

Install all dependencies with npm (one-time step):

```
$ npm i
```

and then execute the build script:

```
$ npm run build
```

This will generate a `/dist` folder with all of the required content including generated documentation.

## Running the Server

Install all dependencies with npm (one-time step):

```
$ npm i
```

and then start the server with the start script:

```
$ npm start
```

The server has successfully started when the following message appears in the console:

```
[http-server] listening on port: 8080
```

Navigating to http://localhost:8080 will take you to a simple UI where you may choose to view either the Websocket API or REST API documentation.
You may also navigate directly to the [Websocket API documention](http://localhost:8080/ws) or the [REST API documentation](http://localhost:8080/rest).

## Testing

### Unit Testing

Much of the code is unit-tested with `jest`. The unit-test suite can be executed with the following command:

```
$ npm test
```

**PLEASE NOTE:** that the unit test suites do require ports `8081` and `8082` to be open in order to do some testing with the Websockets.

### Manual Websocket API Testing

I found the [WebSocket Test Client](https://chrome.google.com/webstore/detail/fgponpodhbmadfljofbimhhlengambbn) Chrome extension to be extremely helpful to do end-2-end testing on the Websocket API. You can open up a connection with a user name by connecting to `ws://localhost:8080/messages?username=<YOUR USER NAME>` in 2 different tabs with 2 different user names. Messages can then be sent between the two clients by sending a message with a payload such as:

```json
{ "recipient": "SomeUser123", "body": "hello!" }
```

This message should come through to the other client's message log after being sent.

### Manual REST API Testing

[Postman](https://www.postman.com/) is a great tool to issue cURL commands to a REST API. This is an example cURL command that can either be imported into Postman, or executed directly:

```
$ curl --location --request GET 'http://localhost:8080/messages?limit=30days&recipient=SomeUser123'
```

and here is another example of using all of the available query parameters:

```
$ curl --location --request GET 'http://localhost:8080/messages?limit=100&sender=AnotherUser876&recipient=SomeUser123'
```
