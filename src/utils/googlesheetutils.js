import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

export const getAuthClient = async () => {
    const client_email = process.env.CLIENT_EMAIL;
    // PRIVATE_KEY formatting issue hack
    const private_key = process.env.PRIVATE_KEY.replace(/\\n/g, '\n');
    console.log(client_email);

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
       spreadsheetId: process.env.SHEET_ID,
       fields: 'sheets',
       ranges: 'School_Birthdays',
       includeGridData: true,
   });

   return data.sheets;
};

export const appendSheetsData = (apiClient, resource) => {
   apiClient.values.append({
        spreadsheetId: process.env.SHEET_ID,
        range: 'School_Birthdays',
        valueInputOption: 'USER_ENTERED',
        resource,
   });
};

export const updateSheetsData = (apiClient, range, resource) => {
    apiClient.values.update({
         spreadsheetId: process.env.SHEET_ID,
         range: `School_Birthdays!${range}`,
         valueInputOption: 'USER_ENTERED',
         resource,
    });
};

export const deleteRow = (apiClient, resource) => {
    apiClient.batchUpdate({
        spreadsheetId: process.env.SHEET_ID,
        resource,
    });
};
