# L2 DataMapping.com API v2

**Revision:** 2.0.6
**Date:** 9/20/2022

---

## 1 Introduction

This document describes the API functionality for DataMapping 2.0 provided so that API customers can access data through a RESTful API.

### Customer

Access to the Data API is granted on a customer-by-customer basis via authenticating customer specific `api_customer` and `api_key` values.

Some customers are super-customers, who can inspect the metadata and records of their associated sub-customer. Therefore, the API makes explicit use of an `api_customer` for authentication and a `customer_id` for specifying the target of the API request.

Customers must be assigned to applications before they can access to data contained in those applications.

### Collection / Application

Application values represent the data collection (VM=voters, CM=constituents, AUTO=auto owners, COM=consumers) and a state abbreviation (50 states, DC, and US) and have the form `<collection>_<state>` such as "VM_AZ", "COM_US", or "AUTO_GA"

### Requests

All API requests must be sent to **https://api.l2datamapping.com**

Requests have the following format:

```
<METHOD> <Request URL>?<Authentication>{&<arguments>}
```

Method is one of the RESTful HTTPS methods: GET, POST, PUT, or DELETE

Authentication can either be achieved via passing `api_customer` and `api_key` values, OR you can use the Get Session request to get a session identifier which can be passed on subsequent requests as a `sess` parameter until it expires.

```
<METHOD> <Request URL>?id=<api_customer>&key=<api_key>{&<arguments>}
<METHOD> <Request URL>?sess=<session_id>{&<arguments>}
```

Passing the `session_id` adds some execution efficiency but requires checking for an error when the session expires and re-establishing the session.

When sending JSON POST bodies, be certain to include the `"Content-Type": "application/json"` header in your requests. If you do not, some requests may behave unexpectedly or fail.

### Responses

Requests will come back with status codes that best reflect the success or failure of the request. All successful requests will return with a 200 status code. Failures will return with a 400, 401, 404, 406, or 500 status code, depending on the reason for failure. Additional information about the failure may be included in the body of the response on JSON responses.

---

## 2 Customer Info

### 2.1 Get Customer

Retrieve information about a specific customer.

A customer may only request information on their own or a subordinate account.

**Request URL:**
```
GET /api/v2/customer/<customer>?<Authentication>
```

**URL Parameters:**
- `customer` - Customer Id

**Example:**
```
/api/v2/customer/3V0L?&id=3V0L&apikey=a1b2c3d4e5
```

**Response:**
```json
{
    "result": "ok",
    "code": 200,
    "customer": {
        "email": "jim.greene@l2political.com",
        "display_name": "L2",
        "description": "L2 Test Account"
    }
}
```

### 2.2 Get Customer Children

Return a list of children customer accounts.

**Request URL:**
```
GET /api/v2/customer/children/<customer>?<Authentication>
```

**URL Parameters:**
- `customer` - Customer Id

**Example:**
```
/api/v2/customer/children/3VOL?id=3V0L&apikey=a1b2c3d4e5
```

**Response:**
```json
{
    "result": "ok",
    "code": 200,
    "children": [
        {
            "id": "3V0M",
            "email": "someusers@emailaddress.com",
            "display_name": "L2 Test Division 1",
            "description": ""
        },
        {
            "id": "3V0N",
            "email": "someusers@emailaddress.com",
            "display_name": "L2 Test Division 2",
            "description": ""
        }
    ]
}
```

### 2.3 Get Customer Applications

Return a list of applications for the customer.

**Request URL:**
```
GET /api/v2/customer/applications/<customer>?<Authentication>
```

**URL Parameters:**
- `customer` - Customer Id

**Example:**
```
/api/v2/customer/applications/3VOL?id=3V0L&apikey=a1b2c3d4e5
```

**Response:**
```json
{
    "result": "ok",
    "code": 200,
    "applications": ["VM_US","AUTO_US","COM_US"]
}
```

---

## 3 Customer Users

### 3.1 Get Customer Users

Return information on the users for a specific customer.

**Request URL:**
```
GET /api/v2/customer/users/<customer>?<Authentication>
```

**URL Parameters:**
- `customer` - Customer Id

**Example:**
```
/api/v2/customer/users/3V0L?id=3V0L&apikey=a1b2c3d4e5
```

**Response:**
```json
{
    "result": "ok",
    "code": 200,
    "users": [
        {
            "username": "id",
            "email": "someusers@emailaddress.com",
            "first_name": "User",
            "last_name": "McUsington",
            "active": true
        },
        {
            "username": "someotherid",
            "email": "someotheruser@emailaddress.com",
            "first_name": "Some",
            "last_name": "Otheruser",
            "active": false
        }
    ]
}
```

### 3.2 Modify Customer User

Modify a user.

**Request URL:**
```
PUT /api/v2/customer/user/<customer>/<username>?id=<Authentication>
```

**URL Parameters:**
- `customer` - Customer Id
- `username` - Unique id for user (usually same as email address)

**Body Parameters:**
- `email` - email address for user
- `passwd` - (optional on updates) password for user
- `first_name` - First name
- `last_name` - Last name
- `is_active` - "true" or "false"

**Example:**
```
/api/v2/customer/user/3V0L/jim.greene%40l2test.com?id=3V0L&apikey=a1b2c3d4e5
```

With body:
```json
{
    "email": "jim.greene@test.com",
    "passwd": "a super secret password",
    "first_name": "User",
    "last_name": "McUsington",
    "active": true
}
```

**Response:**
```json
{
    "result": "ok",
    "code": 200,
    "user": {
        "email": "jim.greene@l2political.com",
        "passwd": "a super secret password",
        "first_name": "User",
        "last_name": "McUsington",
        "active": true
    }
}
```

### 3.3 Get Customer User

Return information on a specific user of a customer.

**Request URL:**
```
GET /api/v2/customer/user/<customer>/<username>?<Authentication>
```

**URL Parameters:**
- `customer` - Customer Id
- `username` - (in url) Unique id for user (usually same as email address)

**Example:**
```
/api/v2/customer/user/3V0L/jim.greene%40l2political.com?id=3V0L&apikey=a1b2c3d4e5
```

**Response:**

Please note that the user's password will not be included in response.

```json
{
    "result": "ok",
    "code": 200,
    "user": {
        "username": "id",
        "email": "someusers@emailaddress.com",
        "first_name": "User",
        "last_name": "McUsington",
        "active": true
    }
}
```

### 3.4 Add Customer User

Add an existing user to a customer.

**Request URL:**
```
POST /api/v2/customer/user/<customer>/<username>?<Authentication>
```

**URL Parameters:**
- `customer` - Customer Id
- `username` - (in url) Unique id for user (usually same as email address)

**Example:**
```
/api/v2/customer/user/3V0L/jim.greene%40l2political.com?id=3V0L&apikey=a1b2c3d4e5
```

**Response:**
```json
{
    "result": "ok",
    "code": 200
}
```

### 3.5 Remove Customer User

Remove a user from a customer.

**Request URL:**
```
DELETE /api/v2/customer/user/<customer>/<username>?<Authentication>
```

**URL Parameters:**
- `customer` - Customer Id
- `username` - (in url) Unique id for user (usually same as email address)

**Example:**
```
/api/v2/customer/user/3V0L/jim.greene%40l2political.com?id=3V0L&apikey=a1b2c3d4e5
```

**Response:**
```json
{
    "result": "ok",
    "code": 200
}
```

---

## 4 Customer Universes

### 4.1 Get Customer Universes

Get the universes for a customer. Note that several Request URLs are provided to narrow to a specific user and/or application.

**Request URL:**
```
GET /api/v2/customer/universes/<customer>?<Authentication>
```

**URL Parameters:**
- `customer` - Customer Id
- `app` - Application Id
- `user` - User Id

**Example:**
```
/api/v2/customer/universes/3V0L?id=3V0L&apikey=a1b2c3d4e5
```

**Response:**
```json
{
    "result": "ok",
    "code": 200,
    "universes": [
        {
            "customer_id": "3V0L",
            "app_id": "VM_MA",
            "universe_id": "0000100010482",
            "name": "01772 – F Dem",
            "description": "Women Democrats in Southborough, MA",
            "username": "jim.greene@l2political.com",
            "cardinality": 1457,
            "date_created": "2018-08-09 03:38:38-0400"
        }
    ]
}
```

### 4.2 Get Customer Application Universes

Get information on all of the universes for a customer in a specific application.

**Request URL:**
```
GET /api/v2/customer/universes/<customer>/<app>?<Authentication>
```

**URL Parameters:**
- `customer` - Customer Id
- `app` - Application Id
- `user` - User Id

**Example:**
```
/api/v2/customer/universes/3V0L/VM_MA?id=3V0L&apikey=a1b2c3d4e5
```

**Response:**
```json
{
    "result": "ok",
    "code": 200,
    "universes": [
        {
            "customer_id": "3V0L",
            "app_id": "VM_MA",
            "universe_id": "0000100010482",
            "name": "01772 – F Dem",
            "description": "Women Democrats in Southborough, MA",
            "username": "jim.greene@l2political.com",
            "cardinality": 1457,
            "date_created": "2018-08-09 03:38:38-0400"
        }
    ]
}
```

### 4.3 Get Customer User Universes

Get information on all of the universes for a customer.

**Request URL:**
```
GET /api/v2/customer/user/universes/<customer>/<user>?<Authentication>
```

**URL Parameters:**
- `customer` - Customer Id
- `user` - User Id

**Example:**
```
/api/v2/customer/user/universes/3V0L/jim.greene%40l2political.com?id=3V0L&apikey=a1b2c3d4e5
```

**Response:**
```json
{
    "result": "ok",
    "code": 200,
    "universes": [
        {
            "customer_id": "3V0L",
            "app_id": "VM_MA",
            "universe_id": "0000100010482",
            "name": "01772 – F Dem",
            "description": "Women Democrats in Southborough, MA",
            "username": "jim.greene@l2political.com",
            "cardinality": 1457,
            "date_created": "2018-08-09 03:38:38-0400"
        }
    ]
}
```

### 4.4 Get Customer User Application Universes

Get information on all of the universes for a customer for a specific application.

**Request URL:**
```
GET /api/v2/customer/user/universes/<customer>/<user>/<app>?<Authentication>
```

**URL Parameters:**
- `customer` - Customer Id
- `app` - Application Id
- `user` - User Id

**Example:**
```
/api/v2/customer/user/universes/3V0L/jim.greene%40l2political.com/VM_MA?id=3V0L&apikey=a1b2c3d4e5
```

**Response:**
```json
{
    "result": "ok",
    "code": 200,
    "universes": [
        {
            "customer_id": "3V0L",
            "app_id": "VM_MA",
            "universe_id": "0000100010482",
            "name": "01772 – F Dem",
            "description": "Women Democrats in Southborough, MA",
            "username": "jim.greene@l2political.com",
            "cardinality": 1457,
            "date_created": "2018-08-09 03:38:38-0400"
        }
    ]
}
```

### 4.5 Get Universe

Retrieve the set of Identifiers that make up a universe.

NOTE: Universes created by sampling will have 2 additional numeric columns.

**Request URL:**
```
GET /api/v2/customer/universe/<customer>/<universe>?<Authentication>
```

**URL Parameters:**
- `customer` - Customer Id
- `universe` - Universe Id

**Example:**
```
/api/v2/customer/universe/3V0L/0000100010482?id=3V0L&apikey=a1b2c3d4e5
```

**Response:**
```
LALFL503989723
LALFL43551362
LALTX119063776
LALMI2423251
LALFL44303406
LALME175465080
…
```

---

## 5 Customer Private Data

### 5.1 Get Customer Application Privates

Get information on all of the universes for a customer in a specific application.

**Request URL:**
```
GET /api/v2/customer/privates/<customer>/<app>?<Authentication>
```

**URL Parameters:**
- `customer` - Customer Id
- `app` - Application Id

**Example:**
```
/api/v2/customer/privates/3V0L/VM_MA?id=3V0L&apikey=a1b2c3d4e5
```

**Response:**
```json
{
    "privates": [
        {
            "customer_id": "3VOL",
            "app_id": "VM_MA",
            "private_id": "3VOL00066",
            "name": "Email Addresses",
            "date_created": "2022-03-18 04:04:44-0400",
            "columns": [
                {
                    "id": "C_3VOL00066_email_addr",
                    "name": "Email Address",
                    "type": "STRING"
                },
                {
                    "id": "C_3VOL00066_email_addr_exists",
                    "name": "Email Address Exists",
                    "type": "ENUM"
                },
                {
                    "id": "C_3VOL00066_Boolean",
                    "name": "Matched",
                    "type": "ENUM"
                }
            ]
        }
    ],
    "result": "ok",
    "code": 200
}
```

---

## 6 Customer Applications

### 6.1 Get Customer Applications

Return the set of applications for the customer.

**Request URL:**
```
GET /api/v2/customer/applications/<customer>?<Authentication>
```

**URL Parameters:**
- `customer` - Customer Id

**Example:**
```
/api/v2/customer/applications/3V0L?id=3V0L&apikey=a1b2c3d4e5
```

**Response:**
```json
{
    "result": "ok",
    "code": 200,
    "applications": [
        {
            "collection": "VM",
            "appname": "VM_CA",
            "description": "California",
            "name": "California"
        },
        {
            "collection": "VM",
            "appname": "VM_MD",
            "description": "Maryland",
            "name": "Maryland"
        }
    ]
}
```

### 6.2 Get Customer Application Columns

Return information on all the API accessible columns for an application of the customer.

**Request URL:**
```
GET /api/v2/customer/application/columns/<customer>/<app>?<Authentication>
```

**URL Parameters:**
- `customer` - Customer Id
- `app` - Application id

**Example:**
```
/api/v2/customer/application/columns/3V0L/VM_MA?id=3V0L&apikey=a1b2c3d4e5
```

**Response:**
```json
{
    "result": "ok",
    "code": 200,
    "columns": [
        {
            "id": "Voters_FirstName",
            "name": "First Name",
            "type": "STRING"
        },
        {
            "id": "Voters_LastName",
            "name": "Last Name",
            "type": "STRING"
        },
        {
            "id": "Residence_Addresses_HouseNumber_searchable",
            "name": "House Number",
            "type": "STRING"
        }
    ]
}
```

### 6.3 Get Customer Application Column Values

Return the set of values for the given column in the customer's application.

**Request URL:**
```
GET /api/v2/customer/application/values/<customer>/<app>/<column>?<Authentication>
```

**URL Parameters:**
- `customer` - Customer Id
- `app` - Application Id
- `column` - Column Id

**Example:**
```
/api/v2/customer/application/column/values/3V0L/VM_MA/Voters_Gender?&id=3V0L&apikey=a1b2c3d4e5f6g7
```

**Response:**
```json
{
    "result": "ok",
    "code": 200,
    "values": [
        "Female",
        "Male"
    ]
}
```

### 6.4 Get Customer Application Column Statistics

Get information on the distribution of values for specific columns within a customer's application based on a specified set of filters.

**Request URL:**
```
GET /api/v2/customer/application/stats/<customer>/<app>?<views>&<filters>?<Authentication>
```

**URL Parameters:**
- `customer` - Customer Id
- `app` - Application Id
- `views` - (requires at least one) Column(s) to get statistics on. Views are selected by adding `view.<column>=1`. Any number of valid columns can be selected.
- `filters` - (optional) Filters are set with `filter.<column>=<list of values>`. The list of values is a comma separated list.

**Example:**
```
/api/v2/customer/application/stats/3V0L/VM_MA?id=3V0L&apikey=a1b2c3d4e5f6g7&view.Parties_Description&filter.Voters_Gender=F
```

**Response:**
```json
{
    "count": "2361139",
    "statistics": {
        "Parties_Description": {
            "Republican": 178256,
            "Conservative": 1088,
            "Democratic": 827300,
            "American Independent": 1419,
            "Constitution": 100,
            "Non-Partisan": 1329577,
            "Green": 1849,
            "Other": 13074,
            "Natural Law": 28,
            "Socialist": 456,
            "Libertarian": 7449,
            "Working Family Party": 429,
            "Prohibition": 6,
            "Rainbow": 51,
            "Reform": 57
        }
    },
    "households": "2003129",
    "result": "ok",
    "code": 200
}
```

---

## 7 Customer Field Sets

### 7.1 Get Customer Application Field Sets

Get information on the customer field sets for this customer and collection.

**Request URL:**
```
GET /api/v2/customer/collection/fieldsets/<customer>/<collection><Authentication>
```

**URL Parameters:**
- `customer` - Customer Id
- `collection` - Collection Id

**Example:**
```
/api/v2/customer/application/colection/3V0L/VM?id=3V0L&apikey=a1b2c3d4e5f6g7
```

**Response:**
```json
{
    "result": "ok",
    "code": 200,
    "count": 454,
    "fieldsets": [
        {
            "id": "CUSTOM::3VOL39FX1",
            "label": "Census Fields",
            "collection": "VM",
            "fields": ["LALVOTERID", "..."]
        },
        {
            "id": "CUSTOM::3VOL49KC2",
            "label": "Address Fields",
            "collection": "VM",
            "fields": ["LALVOTERID", "..."]
        }
    ]
}
```

### 7.2 Get Customer Application Field Set

Get information on a customer field set.

**Request URL:**
```
GET /api/v2/customer/collection/fieldset/<customer>/<fieldset><Authentication>
```

**URL Parameters:**
- `customer` - Customer Id
- `fieldset` - Field Set Id

**Example:**
```
/api/v2/customer/collection/fieldset/3VOL/3VOL49KC2?id=3V0L&apikey=a1b2c3d4e5f6g7
```

**Response:**
```json
{
    "result": "ok",
    "code": 200,
    "id": "CUSTOM::3VOL49KC2",
    "label": "Address Fields",
    "collection": "VM",
    "fields": ["LALVOTERID", "..."]
}
```

### 7.3 Create Customer Field Set

Create a customer field set.

**Request URL:**
```
POST /api/v2/customer/collection/fieldset/<customer>/<collection><Authentication>
```

**URL Parameters:**
- `customer` - Customer Id
- `collection` - Collection Id

**Body Parameters:**
- `label` - A string name for your fieldset. This will be returned in the API or visible to UI users.
- `fields` - An array of field identifiers OR search expressions for gathering fields. The format of these expressions is `<prop>:<regex>` where prop is either ID (field identifier) or LABEL (label for the current data source) such as `ID:^Mailing_Addresses_.*` or `LABEL:^EG_(2016|2020)`

**Example:**
```
/api/v2/customer/collection/fieldset/3VOL/VM?id=3V0L&apikey=a1b2c3d4e5f6g7
```

**Response:**
```json
{
    "result": "ok",
    "code": 200,
    "fieldset": "CUSTOM::3VOL49KC3"
}
```

### 7.4 Delete Customer Field Set

Delete a customer field set.

**Request URL:**
```
DELETE /api/v2/customer/fieldset/<customer>/<fieldset><Authentication>
```

**URL Parameters:**
- `customer` - Customer Id
- `fieldset` - Field Set Id
- `collection` - Collection Id

**Example:**
```
/api/v2/customer/collection/fieldset/3VOL/CUSTOM::3VOL49KC3?id=3V0L&apikey=a1b2c3d4e5f6g7
```

**Response:**
```json
{
    "result": "ok",
    "code": 200
}
```

---

## 8 Searching Records

### 8.1 Estimate Search Results

Use this request to determine the number of records that would be returned by a search query made with the given parameters. Customers of the search API should always perform an estimate request if they are not providing sufficient parameters to narrow the number of results. For example, searching only for results that match a first name of "Bob" in California will results in many thousands of results. This may result in undesired usage fees. In the case where the customer is mainly interested in large result exports (>500 results), this is a useful way to determine what format to specify in a subsequent search request.

**Request URL:**
```
POST /api/v2/records/search/estimate/<customer>/<app>?<Authentication>
```

**URL Parameters:**
- `customer` - Customer Id
- `app` - Application Id

**Body Parameters:**
- `filters` - This JSON object defines a set of filters to apply to the search as `<column>: <value(s)>` as demonstrated in the example below. Acceptable columns can be obtained by retrieving the list of columns for the desired application. Columns of type "STRING" can be searched for exact or wildcard (*, ?) matches. "ENUM" type fields in the records contain one of the set of possible values that can be obtained using the Column Values API. The filter expression can take a single value or an array of multiple values which will search for records that contain any one of the specified values. The special Column `__UNIVERSES` can be used to provide an array of universe ids.
- `circle_filter` - (optional) Specify a latitude, longitude, and radius in meters. This will specify a geographical area in which to limit queries. It consists of an object with floating point keys "lat" and "long", and an integer key "radius".

**Example:**
```
/api/v2/records/search/estimate/3V0L/VM_MA?id=3V0L&apikey=a1b2c3d4e5f6g7
```

With body:
```json
{
    "filters": {
        "Voters_LastName": "Green*",
        "Residence_Addresses_Zip": "01772",
        "Voters_Gender": "F",
        "Parties_Description": ["Democratic", "Republican"]
    },
    "circle_filter": {
        "lat": 42,
        "long": -71,
        "radius": 300000
    }
}
```

**Response:**
```json
{
    "total": 42
}
```

### 8.2 Perform a Search

This API allows for searching records, and usage is billed based on the number of results returned, as well as the fieldset or columns of data requested.

**Request URL:**
```
POST /api/v2/records/search/<customer>/<app>?<Authentication>
```

**URL Parameters:**
- `customer` - Customer Id
- `app` - Application Id

**Body Parameters:**
- `filters` - This JSON object defines a set of filters to apply to the search as `<column>: <value(s)>` as demonstrated in the example below. Acceptable columns can be obtained by retrieving the list of columns for the desired application. Columns of type "STRING" can be searched for exact or wildcard (*, ?) matches. "ENUM" type fields in the records contain one of the set of possible values that can be obtained using the Column Values API. The filter expression can take a single value or an array of multiple values which will search for records that contain any one of the specified values. The special Column `__UNIVERSES` can be used to provide an array of universe ids.

  NOTE: the STRING field `LALVOTERID` can be queried for multiple values by specifying an array (for example, `"LALVOTERID": ["LALMA1200321", "LALMA3400567", "LALMA9800123"]`)

- `format` - (default is "csv") Response data format, either "csv" or "json"
- `fieldset` - (default is "SIMPLE") Specifies the set of fields that will be returned for each result. This can be one of the built-in values SIMPLE, EXTENDED, or ALL, or one of the id values returned by querying the customer's application field sets.
- `columns` - (optional) An array of field identifiers OR search expressions for gathering fields. The format of these expressions is `<prop>:<regex>` where prop is either ID (field identifier) or LABEL (label for the current data source) such as `ID:^Mailing_Addresses_.*` or `LABEL:^EG_(2016|2020)`
- `limit` - The maximum number of records to return. For JSON, the default and maximum is 500.
- `wait` - (default is 10,000 [10 seconds], maximum is 60,000 [60 seconds]) The number of milliseconds to wait for the export to complete. If the waiting period is exceeded, use the functions in the next sections to test the status of the export and to fetch the output when it is ready.

  NOTE: If Wait is 0, then the response will immediately return with the job id rather than attempt to return the results.

- `circle_filter` - (optional) JSON object to specify latitude, longitude, and radius in meters to specify a geographical area in which to limit queries.

**Example:**
```
/api/v2/records/search/3V0L/VM_MA?id=3V0L&apikey=a1b2c3d4e5f6g7
```

With body:
```json
{
    "filters": {
        "Voters_LastName": "Green*",
        "Residence_Addresses_Zip": "01772",
        "Voters_Gender": "F",
        "Parties_Description": ["Democratic", "Republican"]
    },
    "circle_filter": {
        "lat": 42,
        "long": -71,
        "radius": 300000
    }
}
```

**Response:**

If there are no results that match your search, an error will be returned.

If `wait` is set to zero (0) or the duration is exceeded before the search results are complete, the result will look like the following where the job id can be used along with the next two API requests to determine when the export is finished and to fetch the resulting file.

```json
{
    "message": "Generating, check status and fetch when ready",
    "job": "3V0001XG",
    "result": "ok",
    "code": 200
}
```

Otherwise, a file will be returned containing the matching voters based on the specified format:

- `csv` - a file of comma-separated values beginning with a header line containing each field name followed by one line for each matching voter record.
- `json` - a JSON file that is an array of objects representing each matching voter record where the object keys for the voters are the field identifiers.

### 8.3 Get Search Results Status

Use this API to test the status of a search that has timed out.

**Request URL:**
```
POST /api/v2/records/search/status/<job>?<Authentication>
```

**URL Parameters:**
- `job` - Identifier returned from a previous records search for the same customer.

**Example:**
```
/api/v2/records/search/status/3V0001XG?id=3V0L&apikey=a1b2c3d4e5f6g7
```

**Response:**

The status is returned and is either "PROCESSING", "FINISHED", or "ERROR"

```json
{
    "status": "FINISHED",
    "result": "ok",
    "code": 200
}
```

### 8.4 Retrieve Search Results File

Use this API to retrieve the CSV or JSON file created by doing a records search.

**Request URL:**
```
POST /api/v2/records/search/file/<job>?<Authentication>
```

**URL Parameters:**
- `job` - Identifier returned from a previous records search for the same customer.

**Example:**
```
/api/v2/records/search/file/3V0001XG?id=3V0L&apikey=a1b2c3d4e5f6g7
```

**Response:**

A CSV or JSON file will be returned if the export has successfully "FINISHED" (see search results status API.) Otherwise the response will contain information on the status of the export or parameter errors.

---

## 9 Errors

The following errors can be generated by the API requests:

| Error Code | Message |
|------------|---------|
| API_APP_NOT_FOUND | Application not found |
| API_APP_INACTIVE | The application data source has been taken offline for maintenance - Please wait a few minutes to reconnect |
| API_CUST_ACCESS | Customer currently does not have API access. Please contact L2 |
| API_CUST_APP | Your account does not have access to this application |
| API_CUST_NOT_AUTH | Customer not authorized to access this sub-customer |
| API_CUST_NOT_FOUND | Customer not found |
| API_ENDPOINT_NOTFOUND | API Endpoint not found |
| API_ENDPOINT_OFFLINE | This L2DataMapping.com endpoint is currently offline. Please try again later. |
| API_ENDPOINT_OFFLINE_CUST | This L2DataMapping.com endpoint is currently disabled for you. Please try again later. |
| API_FIELD_NOT_ACCESSIBLE | Your account does not have access to the following field(s) for this application |
| API_FIELD_TYPE_INVALID | Field type not valid for this API function |
| API_FILTER_CIRCLE | CIRCLE filter incorrectly formatted "<lat>,<long>,<radius>" expected |
| API_FILTER_FIELD | Field not found |
| API_FILTER_LIMIT | Filter limit hit. Please use less than 12 filters. |
| API_FILTER_TYPE | Filter value on unexpected type |
| API_FILTER_VALUE | Filter value not valid for field |
| API_KEY_INVALID | API Key Invalid for customer |
| API_PRIVATE_APP | Private Data not correct for Application |
| API_PRIVATE_CUST | Private Data not found for Customer |
| API_PRIVATE_DS | Private Data not correct for Data source |
| API_PRIVATE_NOT_FOUND | No matching private data was found |
| API_PURCHASED_FILTER | Attempt to query on purchased data |
| API_RESULT_VALUE | Result value not valid for field |
| API_SEARCH_EXPORT_CUST | Export does not match customer provided |
| API_SEARCH_EXPORT_FAILED | Search Export failed |
| API_SEARCH_EXPORT_NOT_FOUND | Search Export not found |
| API_SEARCH_FIELDSET | Fieldset is invalid |
| API_SEARCH_JSON_LIMIT | Search returned too many results for JSON format |
| API_SEARCH_LIMIT_INTEGER | Provided search limit must be an integer |
| API_SEARCH_LIMIT_EXCEEDED | Provided search limit for JSON must not exceed |
| API_SEARCH_NO_RECORDS | There were no records matching your criteria |
| API_SEARCH_COUNTS_COLUMNS | No more than 3 columns can be provided for format=counts |
| API_SEARCH_COUNTS_ENUMS | All columns must be of type ENUM when format=counts |
| API_STAT_APP | Statistics not found for application |
| API_STAT_COL | Statistics not found for column |
| API_THRESHOLD | Your API threshold reached for the next [dur] |
| API_UNIV_NOT_FOUND | Universe not found for customer |
| API_UNKNOWN | An error occurred processing your request |
| API_USER_CUST | User is not associated with customer |
| API_USER_NOT_FOUND | User not found |
| API_FIELDSET_CUSTOMER | Fieldset is not associated with customer |
| API_COLLECTION | Collection is invalid / Collection is not associated with customer |
| API_INVALID_ARG | Invalid Argument |

---

## 10 Revisions

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2/15/2022 | Initial Documentation |
| 2.0.1 | 2/17/2022 | Added __UNIVERSES to filter for searches and estimates |
| 2.0.2 | 2/28/2022 | Fixed missing customer parameter in documentation for Get Customer Children and Get Customer Applications |
| 2.0.3 | 3/16/2022 | Modify Customer User – attribute "is_active" was listed as "active" |
| 2.0.4 | 3/18/2022 | Removed Highlighting |
| 2.0.5 | 3/18/2022 | Added Customer Privates Endpoint |
| 2.0.6 | 4/21/2022 | URI is now definitively https://api.l2datamapping.com |
