const express = require('express');
const { v4: uuid } = require('uuid');

const customers = [];

// MiddleWare
function verifyIfCPFAlreadyExists(request, response, next){
    const { cpf } = request.headers;

    const customer = customers.find((customer) => customer.cpf === cpf);

    if(!customer){
        return response.status(400).json({error: "customer not found"});
    }
    else{
        request.customer = customer;
        return next();
    }
} 

function getBalance(statement){
    const balance = statement.reduce((acc, operation) => {
        if(operation.type === 'credit'){
            return acc + operation.amount;
        }
        else if(operation.type === "debit"){
            return acc - operation.amount;
        }
    }, 0);

    return balance;
}

const app = express();

app.use(express.json());

app.post('/account', (request, response) => {
    const { cpf, name } = request.body;
    const id = uuid();

    const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf);

    if(customerAlreadyExists){
        response.status(400).send({
            error: "Customer with this CPF already exists"
        })
    }

    customers.push({
        cpf,
        name,
        id,
        statement: []
    });

    response.status(201).send();
})

app.use(verifyIfCPFAlreadyExists);

app.get('/statement', (request, response) => {
    const { customer } = request;
    return response.json(customer.statement);
})

app.post('/deposit', (request, response) => {
    const { description, amount } = request.body;
    const { customer } = request;

    const statementOperation = {
        description,
        amount,
        createdAt: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation);
    return response.status(201).send();
})

app.post('/withdraw', (request, response) => {
    const { amount } = request.body;
    const { customer } = request;

    const balance = getBalance(customer.statement);

    if(balance < amount){
        return response.status(400).send({error: "Insufficient founds!"});
    }
    
    const statementOperation = {
        amount,
        createdAt: new Date(),
        type: "debit"
    }

    customer.statement.push(statementOperation);
    response.status(201).send();
})

app.listen(3000);