Update on AG-UI POC:
As Gemini was not working properly with the copilotkit runtime library in the backend,
So today we implemented the ag-ui poc backend with the ag-ui protocol connected through websocket with Gemini model that will emit ag-ui events to the frontend. 
Implemented Web Socket in AG-UI POC
Also we created a proxy server in the frontend that will convert the normal websocket requests into GraphQL requests as Copilotkit platform only supports graphQL queries. 
Currently we are able to chat with the model.


### Building and running your application

When you're ready, start your application by running:
`docker compose up --build`.

Your application will be available at http://localhost:3000.

### Deploying your application to the cloud

First, build your image, e.g.: `docker build -t myapp .`.
If your cloud uses a different CPU architecture than your development
machine (e.g., you are on a Mac M1 and your cloud provider is amd64),
you'll want to build the image for that platform, e.g.:
`docker build --platform=linux/amd64 -t myapp .`.

Then, push it to your registry, e.g. `docker push myregistry.com/myapp`.

Consult Docker's [getting started](https://docs.docker.com/go/get-started-sharing/)
docs for more detail on building and pushing.

### References
* [Docker's Node.js guide](https://docs.docker.com/language/nodejs/)
