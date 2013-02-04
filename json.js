
/* //////////////////////////////////////////////////////////////////////////

   json.js  version 0.8
   - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


   json parser and stringify

   json.parse( textsource )
   json.stringify( object )


   Uses JSON if supported


   Todo:

   lf JSON not supported, json style dates need work

   Add custom object json generation








   Copyright 2013, databindjs.org
   License     MIT / http://bit.ly/mit-license
   Version     0.95

////////////////////////////////////////////////////////////////////////// */
;(function( window, document )
{

/////////////////////////////////////////////////////////////////////////////
function json()
{
   if ( !(this instanceof json ))
      return new json();

   this.parse_expr = /(:)|(,)|(\[)|(\])|(\{)|(\})|(true)|(false)|(null)|(-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)|"(((\\")|[^"])*)"|'(((\\')|[^'])*)'/g;

}

/////////////////////////////////////////////////////////////////////////////
json.prototype.parse = function( jsonsource )
{
   // use JSON if supported
   if ( undefined !== JSON )
      return JSON.parse( jsonsource );

   var _this = this;

   // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   function token( type, value )
   {
      var _token =
      {
         value: value,
         token_type: type,

         beginindex: 0,
         endindex: 0,

         isinteger: false,
         isrealnumber: false,
      };

      return _token;
   }

   // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   function next()
   {
      var _token = _peeknext;
      if ( _peeknext )
      {
         _peeknext = null;
         return _token;
      }

      // else next
      _token = token();

      // extract token
      var match = _this.parse_expr.exec( jsonsource );

      // end
      if ( !match )
         return null;

      // compute token index value
      var token_type = 0;
      for ( var k = 1, length = match.length; k < length; ++k )
      {
         if ( undefined !== match[ k ] )
         {
            token_type = k;
            break;
         }
      }

      _token.token_type = token_type;

      _token.value = match[0];
      _token.endindex = _this.parse_expr.lastIndex;
      _token.beginindex = _token.endindex - _token.value.length;

      // see if is match value
      var _ismatchvalue = json.mapvalue[ token_type ];
      if ( undefined !== _ismatchvalue )
         _token.value = _ismatchvalue;

      else if ( json.datatypes.TOKEN_REGEX_STRING1 == token_type || json.datatypes.TOKEN_REGEX_STRING2 == token_type )
      {
         _token.value = match[ token_type ].replace( /\\"/g, '"' );
         _token.token_type = json.datatypes.TOKEN_STRING;
      }

      // numbers
      else if ( json.datatypes.TOKEN_NUMBER == token_type )
         _token.value = 1 * _token.value;

      return _token;
   }

   // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   var _peeknext = null;

   // checks and consumes next token if it matches
   function condnext( expected_tokentype )
   {
      var _token = _peeknext;
      if ( !_peeknext )
         _token = _peeknext = next();

      if ( _token.token_type != expected_tokentype )
         return null;

      consume();
      return _token;
   }

   // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   function consume()
   {
      var _token = _peeknext;

      _peeknext = null;
      return _token;
   }

   // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   function term()
   {
      var _token = next();

      // check type
      if ( json.datatypes.TOKEN_OBJBEG == _token.token_type )
          return token( json.datatypes.TOKEN_OBJECT, object());

      if ( json.datatypes.TOKEN_ARRAYBEG == _token.token_type )
          return token( json.datatypes.TOKEN_ARRAY, array());

      return _token;
    }

   // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   function object()
   {
      var obj = {};
      var prevkey = "";

      while ( true )
      {
         if ( condnext( json.datatypes.TOKEN_OBJEND ))
            break;

         // get keyword (must be string)
         var _key = condnext( json.datatypes.TOKEN_STRING );
         if ( !_key )
            throw new Error( prevkey ? "expected key after " + prevkey : "expected key in obj definition" );

         if ( !condnext( json.datatypes.TOKEN_COLON ))
            throw new Error( "expected colon after " + _key );

         // term
         var _term = term();
         if ( !_term )
            throw new Error( "expected valid term for key: " + _key );

         obj[ _key.value ] = _term.value;
         prevkey = _key;

         // look ahead
         if ( condnext( json.datatypes.TOKEN_OBJEND ))
            break;

         if ( !condnext( json.datatypes.TOKEN_COMMA ))
            throw new Error( "expected comma or obj terminator after key: " + _key );

      }

      return obj;
   }

   // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   // array gets a collection of terms terminated by a , or ]
   function array()
   {
      var collection = [];

      while ( true )
      {
         if ( condnext( json.datatypes.TOKEN_ARRAYEND ))
            break;

         // term
         var _term = term();
         if ( !_term )
            throw new Error( "expected valid term for array entry at index: " + collection.length );

         collection.push( _term.value );

         // look ahead
         if ( condnext( json.datatypes.TOKEN_ARRAYEND ))
            break;

         if ( !condnext( json.datatypes.TOKEN_COMMA ))
            throw new Error( "expected comma or obj terminator after index: " + collection.length );

      }

      return collection;
   }

   // initialize
   jsonsource = jsonsource.replace( /\r\n?|[\n\u2028\u2029]/g, "\n").replace(/^\uFEFF/, '');
   _this.parse_expr.lastIndex = 0;

   // get value
   var _term = term();
   return (_term ) ? _term.value : _term;
}

/////////////////////////////////////////////////////////////////////////////
json.datatypes =
{
   TOKEN_UNDEFINED: 0,
   TOKEN_COLON: 1,
   TOKEN_COMMA: 2,
   TOKEN_ARRAYBEG: 3,
   TOKEN_ARRAYEND: 4,
   TOKEN_OBJBEG: 5,
   TOKEN_OBJEND: 6,

   TOKEN_TRUE: 7,
   TOKEN_FALSE: 8,
   TOKEN_NULL: 9,

   TOKEN_NUMBER: 10,
   TOKEN_REGEX_STRING1: 11,
   TOKEN_REGEX_STRING2: 14,

   TOKEN_OBJECT: 210,
   TOKEN_ARRAY: 211,
   TOKEN_STRING: 212,

};

// map values
json.mapvalue = {};
json.mapvalue[ json.datatypes.TOKEN_TRUE ] = true;
json.mapvalue[ json.datatypes.TOKEN_FALSE ] = false;
json.mapvalue[ json.datatypes.TOKEN_NULL ] = null;

/////////////////////////////////////////////////////////////////////////////
json.prototype.stringify = function( obj )
{
   // use JSON if supported
   if ( undefined !== JSON )
      return JSON.stringify( obj );

   var out = [];

   // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   function format( obj )
   {
      if ( null === obj )
         return 'null';

      else if ( false === obj )
         return 'false';

      else if ( true === obj )
         return 'true';

      else if ( obj.each )
         return format_each( obj );

      else if ( typeof obj == 'string' )
         return format_string( obj );

      else if ( obj instanceof Array )
         return format_array( obj );

      // TODO: need to handle date object


      try
      {
         if ( !isNaN( 1 * obj ))
            return obj.toString();

      }
      catch(e){}

      if ( obj instanceof Object )
         return format_object( obj );

      else
         return format( obj.toString());

   }

   // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   function format_string( obj )
   {
      return '"' + obj.toString().replace( /"/g, '\\"' ) + '"';
   }

   // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   function format_each( obj )
   {
      var objout = [];
      obj.each( function( key, item )
      {
         objout.push( '"' + key + '": ' + format( item ));

      });

      return (objout.length) ? '{ ' + objout.join(', ') + ' }' : '{}';
   }

   // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   function format_object( obj )
   {
      var objout = [];
      for ( var key in obj )
         objout.push( '"' + key + '": ' + format( obj[ key ] ));

      return (objout.length) ? '{ ' + objout.join(', ') + ' }' : '{}';
   }

   // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   function format_array( obj )
   {
      var arr = [];
      for ( var k = 0; k < obj.length; ++k )
         arr.push( format( obj[ k ] ));

      return (arr.length) ? '[ ' + arr.join(', ') + ' ]' : '[]';
   }

   return format( obj );
}

json.prototype.toString = json.prototype.stringify;

/////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////
json.parse = function( jsonsource )
{
   var _json = json();
   return _json.parse( jsonsource );
}

json.stringify = function( object )
{
   var _json = json();
   return _json.stringify( object );
}

json.toString = json.stringify;

/////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////
// merge into databindjs space
if ( typeof databindjs !== 'undefined' )
   databindjs.json = json;

return json;

})( window, document );
