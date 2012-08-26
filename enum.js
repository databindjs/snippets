
/* //////////////////////////////////////////////////////////////////////////

   enum.js  version 1.0
   - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

   enum:

   A simple code snippet that support enums.


   
   usage:

   var A = { key1: Enum(),
             key2: Enum(), 
             ...
           };

   // reset enum value 1
   var B = Enum( 1);       // 1
   var C = Enum();         // 2

   var K = Enum( 90 );     // 90
   var J = Enum();         // 90


   Create enumareted list with minimal typing,

   var X = AutoEnum( 'key1 key2 key3 ... ' );

   creates

   var X = { key1: 0,
             key2: 1, 
             ...
           };







   Copyright 2012, databindjs.org
   License     MIT / http://bit.ly/mit-license
   Version     0.95

////////////////////////////////////////////////////////////////////////// */

/////////////////////////////////////////////////////////////////////////////
function Enum( arg )
{
   if ( undefined !== arg )
      Enum.value = arg;

   else if ( undefined === Enum.value )
      Enum.value = 0;

   return Enum.value++;
}

/////////////////////////////////////////////////////////////////////////////
function AutoEnum( string_values, init_value )
{
   // init values
   init_value = init_value || 0;

   // array of values
   string_values = string_values.replace(/^ +/, '' ).replace(/ +$/, '' );
   values = string_values.replace(/[ ,] */g, ' ' ).split( ' ' );

   var ret = {};
   for ( k = 0, length = values.length; k < length; ++k )
      ret[ values[ k]] = init_value++;

   return ret;
}

