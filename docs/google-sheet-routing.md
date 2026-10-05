# Where Rucci quotes land in the Google Sheet

Both dealer sites post to the same Apps Script web app (`GOOGLE_SHEETS_URL`). The script
was written for the Forgiato site, so **Rucci quotes land in the same tab as Forgiato with
no change needed**. To keep them readable there:

- the wheel name is sent as `RUCCI <wheel>`, so the brand is visible in the Wheel column;
- the Rucci-only options (center cap, staggered, color code, big brakes, tires) are folded
  into the Message column, above the customer's own notes;
- Size and Finish go in their usual columns.

The payload also carries `sheet: "Rucci"`, `brand`, and the options as separate fields
(`centerCap`, `staggered`, `colorCode`, `bigBrakes`, `needTires`). The existing script
ignores them. If you ever want a separate tab or dedicated columns, this is the change:

```js
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  if (data.secret !== SECRET) return ContentService.createTextOutput('forbidden');

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(data.sheet || 'Forgiato') || ss.insertSheet(data.sheet);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Date', 'Brand', 'Wheel', 'Image', 'Name', 'Email', 'Phone', 'Year', 'Make',
                     'Model', 'Size', 'Finish', 'Color code', 'Center cap', 'Staggered',
                     'Big brakes', 'Tires', 'Message']);
  }
  sheet.appendRow([new Date(), data.brand || 'Forgiato', data.wheelName, data.wheelImageUrl,
                   data.name, data.email, data.phone, data.vehicleYear, data.vehicleMake,
                   data.vehicleModel, data.sizePreference, data.finishPreference, data.colorCode,
                   data.centerCap, data.staggered, data.bigBrakes, data.needTires, data.message]);
  return ContentService.createTextOutput('ok');
}
```

After editing, Deploy → Manage deployments → edit → Version: New. The URL stays the same.
