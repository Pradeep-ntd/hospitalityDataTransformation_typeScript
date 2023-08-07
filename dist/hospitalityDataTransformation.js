import * as fis from 'fs';
import { create } from 'xmlbuilder2';
var guestBookingsData;
var financialTransactionsData;
export class hospitalityDataTransformation {
    constructor() {
    }
    readGuestBookings(guestBookingJsonPath) {
        try {
            const jsonString = fis.readFileSync('./src/json/guestBookings.json', 'utf-8');
            guestBookingsData = JSON.parse(jsonString);
            return guestBookingsData;
        }
        catch (err) {
            console.error(err);
            return [];
        }
    }
    readFinancialTransactions(readFinancialTransactionsJsonPath) {
        try {
            const jsonString = fis.readFileSync('./src/json/financialTransactions.json', 'utf-8');
            financialTransactionsData = JSON.parse(jsonString);
            return financialTransactionsData;
        }
        catch (err) {
            console.error(err);
            return [];
        }
    }
    generateFinancialCharges(guestBookingsData, financialTransactionsData, isXML) {
        let nameSet = new Set();
        for (let i = 0; i < guestBookingsData.length; i++) {
            const guestData = guestBookingsData[i];
            for (let j = 0; j < financialTransactionsData.length; j++) {
                const financeData = financialTransactionsData[j];
                if (guestData.guestName == financeData.guestName) {
                    if (nameSet.has(guestData.guestName)) {
                        if (guestData.totalAmount >= guestData.amount + financeData.amount) {
                            guestData.transactionType = guestData.transactionType + "," + financeData.transactionType;
                            guestData.amount = guestData.amount + financeData.amount;
                        }
                        else
                            console.error("Total amount is less than the sum of all the transactions");
                    }
                    else {
                        if (guestData.totalAmount >= financeData.amount) {
                            nameSet.add(guestData.guestName);
                            guestData.transactionType = financeData.transactionType;
                            guestData.amount = financeData.amount;
                        }
                        else
                            console.error("Total amount is less than the sum of all the transactions");
                    }
                }
            }
        }
        if (isXML)
            return this.craeteXML(guestBookingsData);
        return JSON.stringify(guestBookingsData);
    }
    craeteXML(guestBookingsData) {
        //XML generation
        const xmlBuilder = create();
        const xmlDocument = xmlBuilder.ele('financialCharges');
        guestBookingsData.forEach((guestData) => {
            const jsonString = JSON.stringify(guestData);
            const jObj = JSON.parse(jsonString);
            const tempDoc = xmlDocument.ele('financialCharge');
            for (const key in jObj) {
                tempDoc.ele(key).att('id', key).txt(jObj[key]).up();
            }
            tempDoc.up();
        });
        const xmlString = xmlDocument.toString({ prettyPrint: true });
        return xmlString;
    }
    generateFinancialPostings(financialTransactionsData) {
        var tempFinanceArray = [];
        var tempFinanceObj = {};
        for (let i = 0; i < financialTransactionsData.length; i++) {
            const financeData = financialTransactionsData[i];
            if (financeData.transactionType != "") {
                tempFinanceObj = {};
                let amount = financeData.amount;
                let transactionType = financeData.transactionType;
                for (let j = i + 1; j < financialTransactionsData.length; j++) {
                    const secondaryfinanceData = financialTransactionsData[j];
                    if (financeData.transactionType == secondaryfinanceData.transactionType && secondaryfinanceData.transactionType != "") {
                        amount += secondaryfinanceData.amount;
                        secondaryfinanceData.transactionType = "";
                    }
                }
                tempFinanceObj["transactionType"] = transactionType;
                tempFinanceObj["amount"] = amount;
                tempFinanceArray.push(tempFinanceObj);
            }
        }
        //XML generation
        const xmlBuilder = create();
        const xmlDocument = xmlBuilder.ele('FinancialPostings');
        for (let i = 0; i < tempFinanceArray.length; i++) {
            const financeData = tempFinanceArray[i];
            const jsonString = JSON.stringify(financeData);
            const jObj = JSON.parse(jsonString);
            const tempDoc = xmlDocument.ele('financialPosting');
            for (const key in jObj) {
                tempDoc.ele(key).att('id', key).txt(jObj[key]).up();
            }
            tempDoc.up();
        }
        const xmlString = xmlDocument.toString({ prettyPrint: true });
        return xmlString;
    }
    crateXMLDocument(rootName, data) {
    }
}
const hdt = new hospitalityDataTransformation();
let readFinancialTransactionspath = './src/json/financialTransactions.json';
let readGuestBookingsPath = './src/json/guestBookings.json';
let isXML = true;
try {
    fis.writeFileSync('./src/outputs/financialCharges.xml', hdt.generateFinancialCharges(hdt.readGuestBookings(readGuestBookingsPath), hdt.readFinancialTransactions(readFinancialTransactionspath), isXML));
    fis.writeFileSync('./src/outputs/financialPostings.xml', hdt.generateFinancialPostings(hdt.readFinancialTransactions(readFinancialTransactionspath)));
    fis.writeFileSync('./src/outputs/financialCharges.json', hdt.generateFinancialCharges(hdt.readGuestBookings(readGuestBookingsPath), hdt.readFinancialTransactions(readFinancialTransactionspath), !isXML));
}
catch (err) {
    console.error(err);
}
