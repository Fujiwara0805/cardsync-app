import { google } from 'googleapis';

// Setup Google API clients
export const getGoogleDriveClient = async (accessToken: string) => {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  
  return google.drive({ version: 'v3', auth });
};

export const getGoogleSheetsClient = async (accessToken: string) => {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  
  return google.sheets({ version: 'v4', auth });
};

// Get files from Google Drive
export const getFilesFromDrive = async (accessToken: string, folderId?: string) => {
  try {
    const drive = await getGoogleDriveClient(accessToken);
    
    let query = "mimeType='image/jpeg' or mimeType='image/png'";
    if (folderId) {
      query += ` and '${folderId}' in parents`;
    }
    
    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name, mimeType, thumbnailLink, webViewLink, createdTime)',
      orderBy: 'createdTime desc',
      pageSize: 30,
    });
    
    return response.data.files || [];
  } catch (error) {
    console.error('Error fetching files from Google Drive:', error);
    throw error;
  }
};

// Create or get spreadsheet
export const getOrCreateSpreadsheet = async (accessToken: string, title: string = 'Business Cards Database') => {
  try {
    const sheets = await getGoogleSheetsClient(accessToken);
    
    // First check if spreadsheet already exists
    const response = await sheets.spreadsheets.list({
      q: `name = '${title}'`,
    });
    
    if (response.data.spreadsheets && response.data.spreadsheets.length > 0) {
      return response.data.spreadsheets[0];
    }
    
    // Create new spreadsheet if it doesn't exist
    const createResponse = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title,
        },
        sheets: [
          {
            properties: {
              title: 'Business Cards',
            },
            data: [
              {
                rowData: [
                  {
                    values: [
                      { userEnteredValue: { stringValue: 'Name' } },
                      { userEnteredValue: { stringValue: 'Company' } },
                      { userEnteredValue: { stringValue: 'Title' } },
                      { userEnteredValue: { stringValue: 'Email' } },
                      { userEnteredValue: { stringValue: 'Phone' } },
                      { userEnteredValue: { stringValue: 'Address' } },
                      { userEnteredValue: { stringValue: 'Website' } },
                      { userEnteredValue: { stringValue: 'Notes' } },
                      { userEnteredValue: { stringValue: 'Image URL' } },
                      { userEnteredValue: { stringValue: 'Created Date' } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    
    return createResponse.data;
  } catch (error) {
    console.error('Error with Google Sheets:', error);
    throw error;
  }
};

// Add business card data to spreadsheet
export const addBusinessCardToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  cardData: {
    name: string;
    company: string;
    title: string;
    email: string;
    phone: string;
    address: string;
    website: string;
    notes: string;
    imageUrl: string;
  }
) => {
  try {
    const sheets = await getGoogleSheetsClient(accessToken);
    
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Business Cards!A:J',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            cardData.name,
            cardData.company,
            cardData.title,
            cardData.email,
            cardData.phone,
            cardData.address,
            cardData.website,
            cardData.notes,
            cardData.imageUrl,
            new Date().toISOString(),
          ],
        ],
      },
    });
    
    return true;
  } catch (error) {
    console.error('Error adding data to Google Sheet:', error);
    throw error;
  }
};