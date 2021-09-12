import * as fs from 'fs';
import { promisify } from 'util';
import { google } from 'googleapis';

const readFile = promisify(fs.readFile);
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const CREDENTIALS_PATH = './credentials.json';
const SHEET_ID = '1x_14MAashhudRP5c7iX1cuk_YhpQOYvzyzNexvxiqUk';

export const getAuthClient = async () => {
   const content = await readFile(CREDENTIALS_PATH)
       .catch( error => console.log('Error loading client secret file:', error));

   const { client_email, private_key } = JSON.parse(content);

   const client = new google.auth.JWT(
       client_email,
       null,
       private_key,
       SCOPES,
       null,
   );

   return client;
};

export const getApiClient = async () => {
   const authClient = await getAuthClient();
   const {spreadsheets: apiClient} = google.sheets({
       version: 'v4',
       auth: authClient,
   });

   return apiClient;
};

export const getSheetsData = async (apiClient) => {
   const { data } = await apiClient.get({
       spreadsheetId: SHEET_ID,
       fields: 'sheets',
       ranges: 'School_Birthdays',
       includeGridData: true,
   });

   return data.sheets;
};

export const appendSheetsData = (apiClient, resource) => {
   apiClient.values.append({
        spreadsheetId: SHEET_ID,
        range: 'School_Birthdays',
        valueInputOption: 'USER_ENTERED',
        resource,
   });
};

export const updateSheetsData = (apiClient, range, resource) => {
    apiClient.values.update({
         spreadsheetId: SHEET_ID,
         range: `School_Birthdays!${range}`,
         valueInputOption: 'USER_ENTERED',
         resource,
    });
};

export const deleteRow = (apiClient, resource) => {
    apiClient.batchUpdate({
        spreadsheetId: SHEET_ID,
        resource,
    });
};
