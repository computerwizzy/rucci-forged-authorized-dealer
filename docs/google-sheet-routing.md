# Routing Rucci quotes to their own tab

Both dealer sites post to the same Apps Script web app (`GOOGLE_SHEETS_URL`). The Rucci
site adds `sheet: "Rucci"` to every payload. In the Apps Script, pick the tab from that
field so Forgiato rows keep landing where they do today:

```js
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  if (data.secret !== SECRET) return ContentService.createTextOutput('forbidden');

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tabName = data.sheet || 'Forgiato';                 // <- new line
  var sheet = ss.getSheetByName(tabName) || ss.insertSheet(tabName);  // <- new line

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Date', 'Wheel', 'Image', 'Name', 'Email', 'Phone', 'Year', 'Make', 'Model',
                     'Size', 'Finish', 'Color code', 'Center cap', 'Staggered', 'Big brakes',
                     'Tires', 'Message']);
  }
  sheet.appendRow([new Date(), data.wheelName, data.wheelImageUrl, data.name, data.email,
                   data.phone, data.vehicleYear, data.vehicleMake, data.vehicleModel,
                   data.sizePreference, data.finishPreference, data.colorCode, data.centerCap,
                   data.staggered, data.bigBrakes, data.needTires, data.message]);
  return ContentService.createTextOutput('ok');
}
```

Deploy the script again as a new version after editing (Deploy → Manage deployments →
edit → Version: New). The URL stays the same.
