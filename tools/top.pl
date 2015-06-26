#!/usr/bin/env perl

=pod

=head1 NAME

top.pl - convert spreadsheet data for use in top ten lists

=head1 SYNOPSIS

    ./top.pl ../output/directory

=head1 DESCRIPTION

=cut

use strict;
use warnings;
use utf8;

use JSON;
use Time::Local;

my $directory = shift @ARGV or die "Usage: top.pl path/to/directory\n";

open my $in, '<:encoding(UTF-8)', '/tmp/daesh-sorties' or die "Can't open /tmp/daesh-sorties: $!\n";
my @lines;
while (<$in>) {
  chomp;
  push @lines, $_;
}
close $in;

for (1..8) {
  shift @lines;
}

# TODO: add mapping of city names

my $top10 = {
  all => {},
  iraq => {},
  syria => {}
};
foreach my $line (@lines) {
  chomp $line;

  my @items = split /\t/, $line, 13;

  next if $items[0] eq '';

  my ($month, $day, $year) = split /\//, $items[0];
  my $date = sprintf "%4d-%02d-%02d", $year, $month, $day;
  my $city = lc $items[3];

  my $iraq = 0;
  if ($items[1] ne '') {
    $iraq += $items[1];
    if (!exists $top10->{iraq}->{$city}) {
      $top10->{iraq}->{$city} = 0;
    }
    $top10->{iraq}->{$city} += $iraq;
  }

  my $syria = 0;
  if ($items[2] ne '') {
    $syria += $items[2];
    if (!exists $top10->{syria}->{$city}) {
      $top10->{syria}->{$city} = 0;
    }
    $top10->{syria}->{$city} += $syria;
  }

  if (!exists $top10->{all}->{$city}) {
    $top10->{all}->{$city} = 0;
  }
  $top10->{all}->{$city} += $iraq;
  $top10->{all}->{$city} += $syria;
}

for my $list (('all', 'iraq', 'syria')) {
  my $filename = $directory . '/top-' . $list . '.tsv';
  open my $out, '>:encoding(UTF-8)', $filename or die "Unable to open $filename for writing: $!\n";

  my @keys = reverse sort { $top10->{$list}->{$a} <=> $top10->{$list}->{$b} } keys %{$top10->{$list}};
  my @top10 = @keys[0..11];

  print $out "city\tcount\n";
  foreach my $key (@top10) {
    print $out "$key\t" . $top10->{$list}->{$key} ."\n";
  }

  close $out;
}
