<?php

//
class db {
	private static $db_connection = false;
	
	public static function connect() {
		self::$db_connection = mysql_connect(config::db_host.":".config::db_port, config::db_user, config::db_password)
		or die("Couldn't connect to DB: " . mysql_error());
		
		mysql_select_db(config::db_name)
		or die("Couldn't select DB: " . mysql_error());
	}
	public static function disconnect() {
		if(!self::$db_connection) return;
		mysql_close(self::$db_connection);
	}
	
	/**
	 * modified version of mysql_query:
	 * - returns result of query as an (associative) array
	 * - if query ends with 'LIMIT 1', the value is returned
	 * - instead of an error message, an exception is thrown
	 * - if query isn't from type 'SELECT', the number of changed rows is returned
	 * @param string $query
	 * @param boolean $assoc
	 */
	public static function query($query, $assoc = true) {
		$r = @mysql_query($query);
		if (mysql_errno()) {
			throw new Exception(mysql_error().", Query: ".$query);
		}
		if (strtolower(substr($query, 0, 6)) != 'select') {
			return array(mysql_affected_rows(), mysql_insert_id(), 'affected'=>mysql_affected_rows(), 'insertid'=>mysql_insert_id());
		}
		$count = @mysql_num_rows($r);
		if (!$count) {
			return false;
		}
		else if ($count == 1) {
			if ($assoc) {
				$f = mysql_fetch_assoc($r);
			}
			else {
				$f = mysql_fetch_row($r);
			}
			mysql_free_result($r);
			if (count($f) == 1 && strtolower(substr($query, -7)) == 'limit 1') {
				list($key) = array_keys($f);
				return $f[$key];
			}
			else if (strtolower(substr($query, -7)) == 'limit 1') {
				return $f;
			}
			else {
				$all = array();
				$all[] = $f;
				return $all;
			}
		}
		else {
			$all = array();
			for ($i = 0; $i < $count; $i++) {
				if ($assoc) {
					$f = mysql_fetch_assoc($r);
				}
				else {
					$f = mysql_fetch_row($r);
				}
				$all[] = $f;
			}
			mysql_free_result($r);
			return $all;
		}
	}
	
	/**
	 * wrapper for mysql_real_escape
	 * @param string $string
	 * @throws InvalidArgumentException
	 */
	public static function value($string) {
		if (is_object($string)) {
			throw new InvalidArgumentException("not a string given");
		}
		$string = mysql_real_escape_string($string);
		$string = "'".$string."'";
		return $string;
	}
}
