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
export const getOrCreateSpreadsheet = async (accessToken: string, title: string = '名刺管理アプリ・データベース') => {
  try {
    const drive = await getGoogleDriveClient(accessToken);
    const sheets = await getGoogleSheetsClient(accessToken);

    const driveResponse = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.spreadsheet' and name='${title}' and trashed=false`,
      fields: 'files(id, name)',
    });

    if (driveResponse.data.files && driveResponse.data.files.length > 0 && driveResponse.data.files[0].id) {
      console.log(`[google-api] Spreadsheet found: ${driveResponse.data.files[0].name} (ID: ${driveResponse.data.files[0].id})`);
      // 注意: ここではスプレッドシートファイルが見つかっただけで、中のシート名は確認していません。
      // 必要であれば、ここでさらに sheets.get を呼び出してシート名を確認し、
      // 目的のシートがなければ作成するロジックもここに追加することが考えられます。
      return { spreadsheetId: driveResponse.data.files[0].id, properties: { title } };
    }

    console.log(`[google-api] Spreadsheet with title '${title}' not found. Creating new one.`);
    const createResponse = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title,
        },
        sheets: [
          {
            properties: {
              title: '名刺管理データベース', // ★ APIが参照するシート名と一致させる
            },
            // 必要であれば初期ヘッダーもここで定義可能
            /* data: [
              {
                rowData: [
                  {
                    values: [
                      { userEnteredValue: { stringValue: '氏名' } },
                      // ... 他のヘッダー
                    ],
                  },
                ],
              },
            ], */
          },
        ],
      },
    });
    console.log(`[google-api] New spreadsheet created with ID: ${createResponse.data.spreadsheetId}, Title: ${createResponse.data.properties?.title}`);
    const initialSheetTitle = createResponse.data.sheets?.[0]?.properties?.title;
    console.log(`[google-api] Initial sheet in new spreadsheet is named: ${initialSheetTitle}`);
    return createResponse.data;
  } catch (error: any) {
    console.error('[google-api] Error in getOrCreateSpreadsheet:', error.message, error.response?.data?.error);
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